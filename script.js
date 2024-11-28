// script.js

// Data processing functions

/**
 * Processes the team types entered by the user.
 * @param {Array} pokemonEntries - Array of objects containing Pokémon types.
 * @returns {Object} Result object containing team analysis.
 */
function processTeamTypes(pokemonEntries) {
  const teamTypes = new Set();
  const teamWeaknesses = []; // Changed from Set to Array of Sets
  const teamResistances = new Set();
  const teamImmunities = new Set();
  const teamOffensiveStrengths = new Set();

  const pokemonWeaknesses = []; // Array to store weaknesses of each Pokémon

  // Aggregate team types and their defensive and offensive properties
  pokemonEntries.forEach((entry) => {
    const types = entry.types;
    const weaknessesSet = new Set(); // Weaknesses for this Pokémon

    types.forEach((t) => {
      teamTypes.add(t);

      // Defensive Weaknesses
      const weaknesses = typeWeaknesses[t] || [];
      weaknesses.forEach((w) => {
        weaknessesSet.add(w);
      });

      // Defensive Resistances
      const resistances = typeResistances[t] || [];
      resistances.forEach((r) => teamResistances.add(r));

      // Defensive Immunities
      const immunities = typeImmunities[t] || [];
      immunities.forEach((i) => teamImmunities.add(i));

      // Offensive Strengths
      const strengths = typeStrengths[t] || [];
      strengths.forEach((s) => teamOffensiveStrengths.add(s));
    });

    pokemonWeaknesses.push(weaknessesSet); // Add this Pokémon's weaknesses to the array
    teamWeaknesses.push(weaknessesSet); // Add to the team weaknesses array
  });

  // Flatten team weaknesses into a single array
  const allTeamWeaknesses = [];
  teamWeaknesses.forEach((weakSet) => {
    weakSet.forEach((w) => allTeamWeaknesses.push(w));
  });

  // Calculate covered types defensively
  const coveredTypesDefensively = new Set([
    ...teamResistances,
    ...teamImmunities,
  ]);

  // Adjusted Weaknesses after considering resistances and immunities
  const adjustedWeaknessesDefensive = [...new Set(allTeamWeaknesses)].filter(
    (w) => !coveredTypesDefensively.has(w)
  );

  // Further adjust weaknesses by removing those covered offensively
  const adjustedWeaknesses = adjustedWeaknessesDefensive.filter(
    (w) => !teamOffensiveStrengths.has(w)
  );

  // Determine if recommendations are needed
  const recommend = pokemonEntries.length < 3;

  // Always calculate recommendedTypes
  let recommendedTypes = recommendTypes(
    new Set(adjustedWeaknesses),
    teamTypes,
    teamWeaknesses,
    teamResistances,
    teamImmunities,
    teamOffensiveStrengths,
    pokemonWeaknesses
  );

  // Only include recommendations in the result if recommend is true
  const displayedRecommendedTypes = recommend ? recommendedTypes : [];

  // Calculate grade if the team is full (3 Pokémon)
  let grade = null;
  if (pokemonEntries.length === 3) {
    grade = calculateGrade(adjustedWeaknesses.length);
  }

  // Find weaknesses shared by at least two Pokémon
  const sharedWeaknesses = findSharedWeaknesses(pokemonWeaknesses);

  const result = {
    teamTypes: Array.from(teamTypes),
    adjustedWeaknessesDefensive,
    teamOffensiveStrengths: Array.from(teamOffensiveStrengths),
    adjustedWeaknesses,
    recommendedTypes: displayedRecommendedTypes,
    recommend,
    pokemonEntries,
    grade,
    sharedWeaknesses,
  };

  return result;
}

/**
 * Recommends individual types to cover remaining weaknesses,
 * avoiding types that introduce shared weaknesses.
 * @param {Set} adjustedWeaknessesSet - Set of remaining weaknesses.
 * @param {Set} teamTypes - Current team types.
 * @param {Array} teamWeaknesses - Array of Sets of weaknesses for each team Pokémon.
 * @param {Set} teamResistances - Set of team resistances.
 * @param {Set} teamImmunities - Set of team immunities.
 * @param {Set} teamOffensiveStrengths - Set of team offensive strengths.
 * @param {Array} pokemonWeaknesses - Array of Sets of weaknesses for each Pokémon.
 * @returns {Array} Array of recommended types with coverage.
 */
function recommendTypes(
  adjustedWeaknessesSet,
  teamTypes,
  teamWeaknesses,
  teamResistances,
  teamImmunities,
  teamOffensiveStrengths,
  pokemonWeaknesses
) {
  const recommended = [];

  const originalAdjustedWeaknesses = Array.from(adjustedWeaknessesSet);

  const allTypes = Object.keys(typeStrengths);

  allTypes.forEach((type) => {
    if (teamTypes.has(type)) return; // Skip types already in the team

    // Check if the type covers any adjusted weaknesses
    const coverage = typeStrengths[type].filter((s) =>
      adjustedWeaknessesSet.has(s)
    ).length;
    if (coverage === 0) return; // Skip types that don't cover any adjusted weaknesses

    // Simulate adding the type to the team
    const newTeamTypes = new Set([...teamTypes, type]);

    // Compute adjusted weaknesses for the new team
    const newAdjustedWeaknesses = getAdjustedWeaknesses(newTeamTypes);

    // Evaluate the type
    const weaknessChange =
      newAdjustedWeaknesses.length - originalAdjustedWeaknesses.length;

    // Get weaknesses of the new type
    const newTypeWeaknesses = new Set(typeWeaknesses[type] || []);

    // Check for shared weaknesses
    let introducesSharedWeakness = false;
    pokemonWeaknesses.forEach((weaknessesSet) => {
      weaknessesSet.forEach((w) => {
        if (newTypeWeaknesses.has(w)) {
          introducesSharedWeakness = true;
        }
      });
    });

    if (introducesSharedWeakness) {
      return; // Skip types that introduce shared weaknesses
    }

    recommended.push({
      type,
      coverage,
      weaknessChange,
    });
  });

  // Sort recommended types
  recommended.sort(
    (a, b) =>
      b.coverage - a.coverage ||
      a.weaknessChange - b.weaknessChange ||
      a.type.localeCompare(b.type)
  );

  return recommended;
}

/**
 * Calculates adjusted weaknesses for a given set of team types.
 * @param {Set} teamTypes - Set of team types.
 * @returns {Array} Array of adjusted weaknesses.
 */
function getAdjustedWeaknesses(teamTypes) {
  const teamWeaknesses = new Set();
  const teamResistances = new Set();
  const teamImmunities = new Set();
  const teamOffensiveStrengths = new Set();

  teamTypes.forEach((t) => {
    // Defensive Weaknesses
    const weaknesses = typeWeaknesses[t] || [];
    weaknesses.forEach((w) => teamWeaknesses.add(w));

    // Defensive Resistances
    const resistances = typeResistances[t] || [];
    resistances.forEach((r) => teamResistances.add(r));

    // Defensive Immunities
    const immunities = typeImmunities[t] || [];
    immunities.forEach((i) => teamImmunities.add(i));

    // Offensive Strengths
    const strengths = typeStrengths[t] || [];
    strengths.forEach((s) => teamOffensiveStrengths.add(s));
  });

  // Calculate covered types defensively
  const coveredTypesDefensively = new Set([
    ...teamResistances,
    ...teamImmunities,
  ]);

  // Adjusted Weaknesses after considering resistances and immunities
  const adjustedWeaknessesDefensive = [...teamWeaknesses].filter(
    (w) => !coveredTypesDefensively.has(w)
  );

  // Further adjust weaknesses by removing those covered offensively
  const adjustedWeaknesses = adjustedWeaknessesDefensive.filter(
    (w) => !teamOffensiveStrengths.has(w)
  );

  return adjustedWeaknesses;
}

/**
 * Finds weaknesses shared by at least two Pokémon.
 * @param {Array} pokemonWeaknesses - Array of Sets containing weaknesses of each Pokémon.
 * @returns {Array} Array of weaknesses shared by at least two Pokémon.
 */
function findSharedWeaknesses(pokemonWeaknesses) {
  const weaknessCount = {};

  pokemonWeaknesses.forEach((weaknesses) => {
    weaknesses.forEach((w) => {
      weaknessCount[w] = (weaknessCount[w] || 0) + 1;
    });
  });

  const sharedWeaknesses = [];
  for (const [weakness, count] of Object.entries(weaknessCount)) {
    if (count >= 2) {
      sharedWeaknesses.push(weakness);
    }
  }

  return sharedWeaknesses;
}

/**
 * Calculates the grade based on the number of adjusted weaknesses.
 * @param {number} numWeaknesses - Number of adjusted weaknesses.
 * @returns {string} Grade.
 */
function calculateGrade(numWeaknesses) {
  if (numWeaknesses === 0) return "S";
  if (numWeaknesses === 1) return "A";
  if (numWeaknesses === 2) return "B";
  if (numWeaknesses === 3) return "C";
  return "D";
}

document.addEventListener("DOMContentLoaded", () => {
  const typesForm = document.getElementById("types-form");
  const validTypesDiv = document.getElementById("valid-types");
  const errorMessageDiv = document.getElementById("error-message");
  const resultsDiv = document.getElementById("results");

  // Display valid types
  const validTypes = Object.keys(typeWeaknesses).sort();
  validTypesDiv.textContent = `Valid types are: ${validTypes.join(", ")}`;

  typesForm.addEventListener("submit", (e) => {
    e.preventDefault();
    errorMessageDiv.innerHTML = "";
    resultsDiv.innerHTML = "";

    const pokemonEntries = [];
    for (let i = 1; i <= 3; i++) {
      const typeInput = document.getElementById(`types${i}`).value;
      if (typeInput) {
        const types = typeInput
          .split(",")
          .map((t) =>
            t
              .trim()
              .charAt(0)
              .toUpperCase() + t.trim().slice(1).toLowerCase()
          )
          .filter((t) => t);

        const invalidTypes = types.filter((t) => !validTypes.includes(t));
        if (invalidTypes.length > 0) {
          const alertDiv = document.createElement("div");
          alertDiv.className = "alert alert-danger";
          alertDiv.textContent = `Invalid types entered: ${invalidTypes.join(
            ", "
          )}`;
          errorMessageDiv.appendChild(alertDiv);
          return;
        }

        pokemonEntries.push({ types });
      }
    }

    if (pokemonEntries.length === 0) {
      const alertDiv = document.createElement("div");
      alertDiv.className = "alert alert-danger";
      alertDiv.textContent = "No types entered.";
      errorMessageDiv.appendChild(alertDiv);
      return;
    }

    // Process the team and display results
    const result = processTeamTypes(pokemonEntries);
    displayResults(result);
  });

  /**
   * Displays the results of the team analysis.
   * @param {Object} result - The result object from processing team types.
   */
  function displayResults(result) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = ""; // Clear previous results

    const headings = [
      "Your Team's Types:",
      "Weaknesses (Defensive):",
      "Offensive Strengths:",
      "Adjusted Weaknesses (After Offensive Coverage):",
    ];

    const data = [
      result.teamTypes,
      result.adjustedWeaknessesDefensive,
      result.teamOffensiveStrengths,
      result.adjustedWeaknesses,
    ];

    // Only display recommendations if 'recommend' is true
    if (result.recommend) {
      headings.push("Recommended Types to Cover Remaining Weaknesses:");
      data.push(result.recommendedTypes);
    }

    // Only display "Team Grade:" if the team is full (3 Pokémon)
    if (result.grade !== null) {
      headings.push("Team Grade:");
      data.push(result.grade);
    }

    // Determine primary and secondary recommendations
    const primaryCoverage = result.recommendedTypes.length
      ? result.recommendedTypes[0].coverage
      : 0;
    const primaryTypes = result.recommendedTypes.filter(
      (item) => item.coverage === primaryCoverage
    );
    const primaryTypeNames = primaryTypes.map((item) => item.type);

    // Find complementary types for primary recommendations
    const remainingWeaknessesAfterPrimary = new Set(result.adjustedWeaknesses);
    primaryTypes.forEach((item) => {
      const strengths = typeStrengths[item.type] || [];
      strengths.forEach((s) => remainingWeaknessesAfterPrimary.delete(s));
    });

    const complementaryTypes = result.recommendedTypes.filter((item) => {
      return (
        item.coverage > 0 &&
        !primaryTypeNames.includes(item.type) &&
        typeStrengths[item.type].some((s) =>
          remainingWeaknessesAfterPrimary.has(s)
        )
      );
    });

    // Avoid duplicating types in primary and complementary
    const complementaryTypeNames = complementaryTypes
      .filter((item) => !primaryTypeNames.includes(item.type))
      .map((item) => item.type);

    headings.forEach((headingText, index) => {
      const heading = document.createElement("h3");
      heading.textContent = headingText;
      resultsDiv.appendChild(heading);

      const paragraph = document.createElement("p");
      if (
        data[index] &&
        (Array.isArray(data[index]) ? data[index].length > 0 : data[index])
      ) {
        if (headingText === "Recommended Types to Cover Remaining Weaknesses:") {
          if (data[index].length > 0) {
            // Display types with coverage counts and color coding
            const list = document.createElement("ul");
            data[index].forEach((item) => {
              const listItem = document.createElement("li");
              listItem.textContent = `${item.type} (${item.coverage})`;

              // Color coding
              if (primaryTypeNames.includes(item.type)) {
                listItem.style.color = "green"; // Primary recommendation
              } else if (complementaryTypeNames.includes(item.type)) {
                listItem.style.color = "green"; // Complementary to primary
              } else {
                listItem.style.color = "orange"; // Secondary recommendation
              }

              list.appendChild(listItem);
            });
            paragraph.appendChild(list);
          } else {
            paragraph.textContent = "None";
          }
        } else if (headingText === "Team Grade:") {
          paragraph.textContent = data[index] ? data[index] : "N/A";

          // If grade is 'S', display confetti animation
          if (data[index] === "S" && typeof confetti === "function") {
            const duration = 2000; // Total duration of the confetti animation in milliseconds
            const animationEnd = Date.now() + duration;

            const colors = [
              "#FF0000", // Red
              "#FFA500", // Orange
              "#FFFF00", // Yellow
              "#00FF00", // Green
              "#00FFFF", // Cyan
              "#0000FF", // Blue
              "#FF00FF", // Magenta
            ];

            (function frame() {
              confetti({
                particleCount: 50,
                spread: 120,
                startVelocity: 30,
                decay: 0.9,
                colors: colors,
                origin: {
                  x: Math.random(), // Random horizontal position
                  y: 0.5 + Math.random() * 0.5, // Random vertical position in the lower half (0.5 to 1.0)
                },
              });

              if (Date.now() < animationEnd) {
                requestAnimationFrame(frame);
              }
            })();
          }
        } else {
          paragraph.textContent = Array.isArray(data[index])
            ? data[index].join(", ")
            : data[index];
        }
      } else {
        paragraph.textContent = "None";
      }
      resultsDiv.appendChild(paragraph);
    });

    // Display warning if two Pokémon are weak to the same type
    if (result.sharedWeaknesses && result.sharedWeaknesses.length > 0) {
      const warningHeading = document.createElement("h3");
      warningHeading.textContent = "Warning:";
      resultsDiv.appendChild(warningHeading);

      const warningParagraph = document.createElement("p");
      warningParagraph.style.color = "red";
      warningParagraph.textContent = `Two or more of your Pokémon are weak to the following types: ${result.sharedWeaknesses.join(
        ", "
      )}`;
      resultsDiv.appendChild(warningParagraph);
    }
  }
});
