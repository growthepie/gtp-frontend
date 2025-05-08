'use client';

import React from 'react';
import ClientAuthorLink from './ClientAuthorLink';

interface Author {
  name: string;
  xUsername: string;
}

interface AuthorsListProps {
  authors: Author[];
  className?: string;
}

const AuthorsList: React.FC<AuthorsListProps> = ({ authors, className = '' }) => {
  if (!authors || authors.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center h-full gap-x-2 ${className}`}>
      <span className="text-sm text-forest-700 dark:text-forest-300"></span>
      {authors.map((author, index) => (
        <React.Fragment key={author.xUsername}>
          <ClientAuthorLink 
            name={author.name} 
            xUsername={author.xUsername} 
          />
          {index < authors.length - 1 && (
            <svg width="6" height="6" viewBox="0 0 6 6" fill="#344240">
                <circle cx="3" cy="3" r="3" />
            </svg>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default AuthorsList;