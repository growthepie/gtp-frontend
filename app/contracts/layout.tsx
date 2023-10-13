import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import Icon from "@/components/layout/Icon";
import AddressSearch from "./address-search";

export default async function ContractsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Container className="flex flex-col w-full mt-[65px] md:mt-[45px] -mb-14">
        <div className="flex justify-between items-start w-full">
          <div className="flex items-start">
            <Heading
              className="text-[30px] leading-snug md:text-[36px] mb-[15px] md:mb-[30px]"
              as="h1"
            >
              Contracts
            </Heading>
          </div>
        </div>
        {/* <Subheading
          className="text-[16px]"
          iconContainerClassName="items-center mb-[22px] md:mb-[32px] relative"
          leftIcon={
            <Icon
              icon="feather:search"
              className="relative w-5 h-5 md:w-6 md:h-6"
            />
          }
        >
          <p>Description</p>
        </Subheading> */}
        <AddressSearch />
        {children}
      </Container>
    </>
  );
}
