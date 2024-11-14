// script.js
function processTeamTypes(pokemonEntries) {
    const teamTypes = new Set();
    const teamWeaknesses = new Set();
    const teamResistances = new Set();
    const teamImmunities = new Set();
    const teamOffensiveStrengths = new Set();

    pokemonEntries.forEach((entry) => {
        const types = entry.types;
        types.forEach((t) => {
            teamTypes.add(t);

            // Weaknesses
            const weaknesses = typeWeaknesses[t] || [];
            weaknesses.forEach((w) => teamWeaknesses.add(w));

            // Resistances
            const resistances = typeResistances[t] || [];
            resistances.forEach((r) => teamResistances.add(r));

            // Immunities
            const immunities = typeImmunities[t] || [];
            immunities.forEach((i) => teamImmunities.add(i));

            // Offensive Strengths
            const strengths = typeStrengths[t] || [];
            strengths.forEach((s) => teamOffensiveStrengths.add(s));
        });
    });

    const coveredTypesDefensively = new Set([
        ...teamResistances,
        ...teamImmunities,
    ]);
    const adjustedWeaknessesDefensive = [...teamWeaknesses].filter(
        (w) => !coveredTypesDefensively.has(w)
    );
    const adjustedWeaknesses = adjustedWeaknessesDefensive.filter(
        (w) => !teamOffensiveStrengths.has(w)
    );

    const recommend = pokemonEntries.length < 3;
    const recommendedTypes = recommend
        ? recommendTypes(new Set(adjustedWeaknesses))
        : null;

    const result = {
        teamTypes: Array.from(teamTypes),
        adjustedWeaknessesDefensive,
        teamOffensiveStrengths: Array.from(teamOffensiveStrengths),
        adjustedWeaknesses,
        recommendedTypes,
        recommend,
        pokemonEntries,
    };

    return result;
}

function recommendTypes(adjustedWeaknessesSet) {
    const recommended = new Set();

    adjustedWeaknessesSet.forEach((weakness) => {
        for (const [type, strengths] of Object.entries(typeStrengths)) {
            if (strengths.includes(weakness)) {
                // Check if the recommended type is not weak to any of the adjusted weaknesses
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


// Function to process the form submission
document.addEventListener("DOMContentLoaded", () => {
    const typesForm = document.getElementById("types-form");
    const validTypesDiv = document.getElementById("valid-types");
    const errorMessageDiv = document.getElementById("error-message");
    const resultsDiv = document.getElementById("results");
  
    // Display valid types
    const validTypes = Object.keys(typeWeaknesses).sort();
    validTypesDiv.innerHTML = `<strong>Valid types are:</strong> ${validTypes.join(
      ", "
    )}`;
  
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
            .map((t) => t.trim().charAt(0).toUpperCase() + t.trim().slice(1))
            .filter((t) => t);
  
          const invalidTypes = types.filter((t) => !validTypes.includes(t));
          if (invalidTypes.length > 0) {
            errorMessageDiv.innerHTML = `<div class="alert alert-danger">Invalid types entered: ${invalidTypes.join(
              ", "
            )}</div>`;
            return;
          }
  
          pokemonEntries.push({ types });
        }
      }
  
      if (pokemonEntries.length === 0) {
        errorMessageDiv.innerHTML = `<div class="alert alert-danger">No types entered.</div>`;
        return;
      }
  
      // Process the team and display results
      const result = processTeamTypes(pokemonEntries);
      displayResults(result);
    });
  });
  
  // Function to display the results
  function displayResults(result) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = `
      <h3>Your Team's Types:</h3>
      <p>${result.teamTypes.join(", ")}</p>
  
      <h3>Weaknesses (Defensive):</h3>
      <p>${result.adjustedWeaknessesDefensive.join(", ") || "None"}</p>
  
      <h3>Offensive Strengths:</h3>
      <p>${result.teamOffensiveStrengths.join(", ") || "None"}</p>
  
      <h3>Adjusted Weaknesses (After Offensive Coverage):</h3>
      <p>${result.adjustedWeaknesses.join(", ") || "None"}</p>
    `;
  
    if (result.recommend) {
      resultsDiv.innerHTML += `
        <h3>Recommended Types to Cover Remaining Weaknesses:</h3>
        <p>${result.recommendedTypes.join(", ") || "None"}</p>
      `;
    }
  }
  