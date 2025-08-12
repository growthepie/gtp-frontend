import { TitleButtonLink } from '@/components/layout/TextHeadingComponents';
import { GTPIconName } from '@/icons/gtp-icon-names';
import { TitleButtonBlock as TitleButtonBlockType } from '@/lib/types/blockTypes';
import Link from 'next/link';

interface TitleButtonBlockProps {
  block: TitleButtonBlockType;
}

export const TitleButtonBlock: React.FC<TitleButtonBlockProps> = ({ block }) => {
  return (
    <TitleButtonLink href={block.url} newTab={true} label={block.text} rightIcon={"feather:arrow-right" as GTPIconName} containerClassName={`pl-0 ${block.className}`} />
  );
};