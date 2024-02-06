import Icon from "./Icon";

type Props = {
  icon: string;
  className?: string;
  onClick?: () => void;
};

const ServerIcon = ({ icon, className, onClick }: Props) => {
  return (
    <div className={className} onClick={onClick}>
      <Icon icon={icon} className={className} />
    </div>
  );
};

export default ServerIcon;
