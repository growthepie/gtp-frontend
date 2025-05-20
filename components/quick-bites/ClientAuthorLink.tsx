// File: components/quick-bites/ClientAuthorLink.tsx
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
      className="flex items-center text-xxs md:text-xs xl:text-sm gap-x-[5px] hover:underline"
      aria-label={`Author: ${name} (opens in a new tab)`}
    >
      <Icon icon="ri:twitter-x-fill" className="w-[15px] h-[15px]" aria-hidden="true" />
      <span>{name}</span>
    </a>
  );
};

export default ClientAuthorLink;