// script.js

// Data processing functions

/**
 * Processes the team types entered by the user.
 * @param {Array} pokemonEntries - Array of objects containing Pokémon types.
 * @returns {Object} Result object containing team analysis.
 */
function processTeamTypes(pokemonEntries) {
  const teamTypes = new Set();
  const teamWeaknesses = new Set();
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
        teamWeaknesses.add(w);
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

  // Determine if recommendations are needed
  const recommend = pokemonEntries.length < 3;

  // Always calculate recommendedTypes
  let recommendedTypes = recommendTypes(
    new Set(adjustedWeaknesses),
    teamTypes,
    teamWeaknesses,
    teamResistances,
    teamImmunities,
    teamOffensiveStrengths
  );

  // Sort recommended types based on coverage of adjusted weaknesses
  recommendedTypes = sortRecommendedTypes(
    recommendedTypes,
    new Set(adjustedWeaknesses)
  );

  // Filter out less optimal recommendations (e.g., red options)
  recommendedTypes = recommendedTypes.filter(
    (item) => item.weaknessChange <= 1
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
    sharedWeaknesses, // Add shared weaknesses to the result
  };

  return result;
}

/**
 * Recommends types (including dual types) to cover remaining weaknesses.
 * @param {Set} adjustedWeaknessesSet - Set of remaining weaknesses.
 * @param {Set} teamTypes - Current team types.
 * @returns {Array} Array of recommended types with evaluation.
 */
function recommendTypes(
  adjustedWeaknessesSet,
  teamTypes,
  teamWeaknesses,
  teamResistances,
  teamImmunities,
  teamOffensiveStrengths
) {
  const recommended = [];

  const originalAdjustedWeaknesses = Array.from(adjustedWeaknessesSet);

  const allTypes = Object.keys(typeStrengths);

  // Generate all possible single and dual-type combinations
  const typeCombinations = [];

  for (const type1 of allTypes) {
    if (teamTypes.has(type1)) continue;

    typeCombinations.push([type1]); // Single type

    for (const type2 of allTypes) {
      if (type1 === type2 || teamTypes.has(type2)) continue;

      // To avoid duplicate combinations
      if (type1 < type2) {
        typeCombinations.push([type1, type2]); // Dual type
      }
    }
  }

  typeCombinations.forEach((combo) => {
    const comboTypes = new Set(combo);

    // Check if the combination covers any adjusted weaknesses
    const coverage = getOffensiveStrengths(comboTypes).filter((s) =>
      adjustedWeaknessesSet.has(s)
    ).length;
    if (coverage === 0) {
      return; // Skip combinations that don't cover any adjusted weaknesses
    }

    // Simulate adding the combination to the team
    const newTeamTypes = new Set([...teamTypes, ...comboTypes]);

    // Compute adjusted weaknesses for the new team
    const newAdjustedWeaknesses = getAdjustedWeaknesses(newTeamTypes);

    // Evaluate the combination
    const weaknessChange =
      newAdjustedWeaknesses.length - originalAdjustedWeaknesses.length;

    recommended.push({
      combo: combo.join(", "),
      coverage,
      weaknessChange,
    });
  });

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
 * Gets the offensive strengths for a set of types.
 * @param {Set} types - Set of types.
 * @returns {Array} Array of offensive strengths.
 */
function getOffensiveStrengths(types) {
  const strengths = new Set();
  types.forEach((t) => {
    const typeStrength = typeStrengths[t] || [];
    typeStrength.forEach((s) => strengths.add(s));
  });
  return Array.from(strengths);
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
 * Sorts recommended types based on coverage and weakness change.
 * @param {Array} recommendedTypes - Array of recommended types with evaluation.
 * @param {Set} adjustedWeaknesses - Set of remaining weaknesses.
 * @returns {Array} Sorted array of recommended types.
 */
function sortRecommendedTypes(recommendedTypes, adjustedWeaknesses) {
  return recommendedTypes
    .sort(
      (a, b) =>
        b.coverage - a.coverage ||
        a.weaknessChange - b.weaknessChange ||
        a.combo.localeCompare(b.combo)
    );
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

    // Convert adjustedWeaknesses to a Set for efficient lookup
    const adjustedWeaknessesSet = new Set(result.adjustedWeaknesses);

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
              listItem.textContent = `${item.combo} (${item.coverage})`;

              // Color coding based on weaknessChange
              if (item.weaknessChange <= 0) {
                listItem.style.color = "green"; // Best recommendations
              } else if (item.weaknessChange === 1) {
                listItem.style.color = "orange"; // Good recommendations
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
            // ... existing confetti code ...
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
