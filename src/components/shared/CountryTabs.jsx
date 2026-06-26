import React from 'react';

export default function CountryTabs({ countries, activeCountry, onSelect, data, countryKey = 'country' }) {
  const getCounts = (country) => {
    if (country === 'All') return data.length;
    return data.filter(r => r[countryKey] === country).length;
  };

  return (
    <div className="country-tabs" role="tablist" aria-label="Country filter">
      {countries.map(country => (
        <button
          key={country}
          role="tab"
          aria-selected={activeCountry === country}
          className={`country-tab ${activeCountry === country ? 'active' : ''}`}
          onClick={() => onSelect(country)}
          id={`country-tab-${country.toLowerCase().replace(/\s/g, '-')}`}
        >
          {country}
          <span className="country-tab-count">{getCounts(country)}</span>
        </button>
      ))}
    </div>
  );
}
