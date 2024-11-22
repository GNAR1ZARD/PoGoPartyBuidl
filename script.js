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

  // Aggregate team types and their defensive and offensive properties
  pokemonEntries.forEach((entry) => {
    const types = entry.types;
    types.forEach((t) => {
      teamTypes.add(t);

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
  let recommendedTypes = recommendTypes(new Set(adjustedWeaknesses));

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


  const result = {
    teamTypes: Array.from(teamTypes),
    adjustedWeaknessesDefensive,
    teamOffensiveStrengths: Array.from(teamOffensiveStrengths),
    adjustedWeaknesses,
    recommendedTypes: displayedRecommendedTypes,
    recommend,
    pokemonEntries,
    grade, // Added grade to the result
  };

  return result;
}

/**
 * Recommends types to cover remaining weaknesses.
 * @param {Set} adjustedWeaknessesSet - Set of remaining weaknesses.
 * @returns {Array} Array of recommended types.
 */
function recommendTypes(adjustedWeaknessesSet) {
  const recommended = new Set();

  adjustedWeaknessesSet.forEach((weakness) => {
    for (const [type, strengths] of Object.entries(typeStrengths)) {
      if (strengths.includes(weakness)) {
        // Ensure the recommended type doesn't have weaknesses to any of the adjusted weaknesses
        const tWeaknesses = new Set(typeWeaknesses[type] || []);
        const intersection = [...tWeaknesses].filter((w) =>
          adjustedWeaknessesSet.has(w)
        );
        if (intersection.length === 0) {
          recommended.add(type);
        }
      }
    }
  });

  return Array.from(recommended);
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
}
