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

  // Always calculate recommendedTypes for grading purposes
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
 * Recommends types to cover remaining weaknesses, ensuring they are a net positive.
 * @param {Set} adjustedWeaknessesSet - Set of remaining weaknesses.
 * @param {Set} teamTypes - Current team types.
 * @returns {Array} Array of recommended types.
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

  for (const type of Object.keys(typeStrengths)) {
    if (teamTypes.has(type)) {
      continue; // Skip types already in the team
    }

    // Check if the type covers any adjusted weaknesses
    const coverage = typeStrengths[type].filter((s) =>
      adjustedWeaknessesSet.has(s)
    ).length;
    if (coverage === 0) {
      continue; // Skip types that don't cover any adjusted weaknesses
    }

    // Simulate adding the type to the team
    const newTeamTypes = new Set([...teamTypes, type]);

    // Compute adjusted weaknesses for the new team
    const newAdjustedWeaknesses = getAdjustedWeaknesses(newTeamTypes);

    if (newAdjustedWeaknesses.length < originalAdjustedWeaknesses.length) {
      // The adjusted weaknesses decreased, recommend this type
      recommended.push(type);
    } else if (
      newAdjustedWeaknesses.length === originalAdjustedWeaknesses.length
    ) {
      // Ensure no new weaknesses are introduced
      const newWeaknesses = typeWeaknesses[type] || [];
      const coveredTypesDefensively = new Set([
        ...teamResistances,
        ...teamImmunities,
      ]);
      const potentialNewWeaknesses = newWeaknesses.filter(
        (w) => !teamWeaknesses.has(w) && !coveredTypesDefensively.has(w)
      );

      if (potentialNewWeaknesses.length === 0) {
        // No new weaknesses introduced, recommend this type
        recommended.push(type);
      }
    }
    // Else, the adjusted weaknesses increased, do not recommend
  }

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
 * Sorts recommended types based on how many adjusted weaknesses they cover.
 * Types covering more weaknesses are prioritized.
 * @param {Array} recommendedTypes - Array of recommended types.
 * @param {Set} adjustedWeaknesses - Set of remaining weaknesses.
 * @returns {Array} Sorted array of recommended types.
 */
function sortRecommendedTypes(recommendedTypes, adjustedWeaknesses) {
  return recommendedTypes
    .map((type) => {
      // Calculate how many weaknesses this type can cover
      const coverage = typeStrengths[type].filter((strength) =>
        adjustedWeaknesses.has(strength)
      ).length;
      return { type, coverage };
    })
    // Sort types by coverage in descending order
    .sort((a, b) => b.coverage - a.coverage || a.type.localeCompare(b.type))
    // Return only the type names, ordered by coverage
    .map((item) => item.type);
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

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * @param {string} str - The string to escape.
 * @returns {string} Escaped string.
 */
function escapeHTML(str) {
  if (typeof str !== "string") {
    return str;
  }
  return str.replace(/[&<>"'`=\/]/g, function (s) {
    return (
      {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "/": "&#x2F;",
        "`": "&#x60;",
        "=": "&#x3D;",
      }[s] || s
    );
  });
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
          // Display types with coverage counts
          const recommendedWithCount = data[index].map((type) => {
            const coverage = typeStrengths[type].filter((strength) =>
              adjustedWeaknessesSet.has(strength)
            ).length;
            return `${type} (${coverage})`;
          });
          paragraph.textContent = recommendedWithCount.join(", ");
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
