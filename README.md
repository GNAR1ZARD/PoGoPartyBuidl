# Pokémon Go Party Builder 🕹️

Welcome to the **PoGo Party Builder**! This web application helps you build a balanced Pokémon team by analyzing types, identifying weaknesses, and suggesting additional types to cover any gaps in your team's defenses and offenses.

## 🌟 Features

- **Type Analysis**: Enter up to three Pokémon types to analyze your team's strengths and weaknesses.
- **Weakness Coverage**: Identify defensive weaknesses and get recommendations to cover them.
- **Offensive Strengths**: Discover your team's offensive advantages against other types.
- **Recommendations**: If your team is incomplete, get suggested types to fill in the gaps.

## 🚀 Getting Started

Access the application directly through your web browser—no installation required!

**Website URL**: [PoGo Party Builder](https://gnar1zard.github.io/PoGoPartyBuidl/)

## 📖 How to Use

1. **Open the Application**: Navigate to the [PoGo Party Builder](https://gnar1zard.github.io/PoGoPartyBuidl/) in your preferred web browser.

2. **Enter Pokémon Types**:
   - You can enter up to three Pokémon, specifying their types.
   - For each Pokémon:
     - Input one or two types separated by a comma.
     - Example: `Fire, Flying` for Charizard.

3. **Submit the Form**:
   - Click the **Submit** button to analyze your team.

4. **View the Results**:
   - **Your Team's Types**: Displays all the types you've entered.
   - **Weaknesses (Defensive)**: Shows the types your team is vulnerable to.
   - **Offensive Strengths**: Lists the types your team is strong against offensively.
   - **Adjusted Weaknesses**: Weaknesses remaining after considering your offensive strengths.
   - **Recommended Types**: If you've entered fewer than three Pokémon, the app suggests additional types to cover remaining weaknesses.

## 📝 Example Usage

Let's say you have the following team:

- **Pokémon 1**: `Water`
- **Pokémon 2**: `Fire`
- **Pokémon 3**:

**Results**:

- **Your Team's Types**: Water, Fire
- **Weaknesses (Defensive)**: Electric, Ground, Rock
- **Offensive Strengths**: Fire, Ground, Rock, Grass, Ice, Bug, Steel
- **Adjusted Weaknesses**: Electric
- **Recommended Types**: Ground

## ❗ Input Validation and Error Handling

- **Input Validation and Sanitization**: The application incorporates robust input validation and sanitization mechanisms to protect against injection attacks, such as Cross-Site Scripting (XSS). All user inputs are carefully validated against a list of valid Pokémon types and sanitized before processing. This ensures that only legitimate data is used, maintaining the security and integrity of the application.

- **Invalid Types**: If you enter an **invalid type**, the application will display an error message specifying which types are invalid. This helps you quickly identify and correct any typos or mistakes.

- **No Types Entered**: If **no types** are entered, an error message will prompt you to input at least one type to proceed with the analysis.

- **Input Format**: The application accepts types in a specific format to ensure proper processing:
  - **Capitalization**: Types are case-insensitive but will be normalized to have the first letter capitalized (e.g., `fire` becomes `Fire`).
  - **Separation**: For dual-type Pokémon, separate types with a comma (e.g., `Fire, Flying`).
  - **Whitespaces**: Extra spaces before or after type names are trimmed automatically.

By enforcing strict input validation and sanitization, the application not only enhances user experience by providing immediate feedback but also safeguards against potential security vulnerabilities associated with handling user-provided data.

## 🛠️ Built With

- **HTML5**: Markup language for structuring the web page.
- **CSS3**: Styling to enhance the visual appearance.
- **JavaScript**: Client-side scripting for interactive features.
- **GitHub Pages**: Hosting platform for the application.
