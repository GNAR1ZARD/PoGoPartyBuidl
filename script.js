// script.js

// Data processing functions

// Function to process the team types (converted from app.py)
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
      : [];
  
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
  
  // Function to recommend types
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
  
  // Function to escape HTML to prevent XSS attacks
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
            .map((t) => t.trim().charAt(0).toUpperCase() + t.trim().slice(1).toLowerCase())
            .filter((t) => t);
  
          const invalidTypes = types.filter((t) => !validTypes.includes(t));
          if (invalidTypes.length > 0) {
            const alertDiv = document.createElement("div");
            alertDiv.className = "alert alert-danger";
            alertDiv.textContent = `Invalid types entered: ${invalidTypes.join(", ")}`;
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
  
    headings.forEach((headingText, index) => {
      const heading = document.createElement("h3");
      heading.textContent = headingText;
      resultsDiv.appendChild(heading);
  
      const paragraph = document.createElement("p");
      paragraph.textContent = data[index].join(", ") || "None";
      resultsDiv.appendChild(paragraph);
    });
  
    if (result.recommend) {
      const recommendHeading = document.createElement("h3");
      recommendHeading.textContent = "Recommended Types to Cover Remaining Weaknesses:";
      resultsDiv.appendChild(recommendHeading);
  
      const recommendParagraph = document.createElement("p");
      recommendParagraph.textContent =
        result.recommendedTypes.join(", ") || "None";
      resultsDiv.appendChild(recommendParagraph);
    }
  }
  