
function LanguageSelector({ language, setLanguage }) {
  const languages = [
    { code: "en", name: "English" },
    { code: "ta", name: "Tamil" },
    { code: "te", name: "Telugu" },
    { code: "hi", name: "Hindi" },
    { code: "ml", name: "Malayalam" },
    { code: "kn", name: "Kannada" },
    { code: "fr", name: "French" },
    { code: "es", name: "Spanish" },
  ];

  return (
    <div className="language-selector">
      <label htmlFor="language">Select Language</label>

      <select
        id="language"
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LanguageSelector;
