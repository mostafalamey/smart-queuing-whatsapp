import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../i18n';

interface LanguageToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ 
  className = '', 
  showLabel = true 
}) => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className={`kiosk-language-toggle ${className}`}
      aria-label={t.language}
      title={t.language}
    >
      <Globe className="w-5 h-5" />
      {showLabel && (
        <span className="kiosk-language-label">
          {language === 'en' ? 'العربية' : 'English'}
        </span>
      )}
    </button>
  );
};

export default LanguageToggle;
