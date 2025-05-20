import React, { memo } from 'react';
import { DraggableContainer } from './DraggableContainer';

interface FilterSelectionContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const FilterSelectionContainer = memo(({
  children,
  className = '',
}: FilterSelectionContainerProps) => (
  <DraggableContainer
    className={`flex gap-x-[10px] items-center justify-start h-full ${className} overflow-x-hidden`}
    direction="horizontal"
  >
    {children}
  </DraggableContainer>
));

FilterSelectionContainer.displayName = 'FilterSelectionContainer';