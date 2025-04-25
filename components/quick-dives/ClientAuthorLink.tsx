// File: components/quick-dives/ClientAuthorLink.tsx
'use client';

import React from 'react';
import { Icon } from '@iconify/react';

interface ClientAuthorLinkProps {
  name: string;
  xUsername: string;
}

const ClientAuthorLink: React.FC<ClientAuthorLinkProps> = ({ name, xUsername }) => {
  return (
    <a 
      href={`https://x.com/${xUsername}`} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center text-xs text-forest-800 dark:text-forest-300 hover:underline"
    >
      <Icon icon="ri:twitter-x-fill" className="w-3.5 h-3.5 mr-1.5" />
      <span>{name}</span>
    </a>
  );
};

export default ClientAuthorLink;