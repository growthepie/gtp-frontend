import { ChainsProvider } from "../../contexts/ChainsContext";

type Props = {
  children: React.ReactNode;
  params: { chain: string };
};

export default function ChainsLayout({
  children, params
}: Props) {
  return (

    <ChainsProvider chainKey={params.chain}>
      {children}
    </ChainsProvider>

  );
}
