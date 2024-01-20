import Icon from "./Icon";

type Props = {
  icon: string;
  className?: string;
};

const ServerIcon = ({ icon, className }: Props) => {
  return (
    <div className={className}>
      <Icon icon={icon} className={className} />
    </div>
  );
};

export default ServerIcon;
