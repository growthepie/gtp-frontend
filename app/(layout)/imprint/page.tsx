import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import React from "react";

const Imprint = () => {
  return (
    <Container className="mt-[45px] md:mt-[30px]">
      <Heading className="text-[48px] mb-[30px] leading-snug" as="h1">
        Imprint
      </Heading>
      <div className="text-lg mb-6">
        Information in accordance with Section 5 TMG:
      </div>

      <div className="flex flex-col">
        <div className="flex flex-col w-full">
          <div className="mb-4">
            c/o w3.hub <br />
            orbal GmbH / growthepoe <br />
            Möckernstr. 120 <br />
            10963 Berlin <br />
            Germany
          </div>
          <div className="mb-4">
            Register Number: HRB 252443 B <br />
            Register Court: Amtsgericht Charlottenburg <br />
            VAT Number: DE361013740 <br />
          </div>
          <div className="mb-4">Represented by: Matthias Seidl</div>

          <h2 className="text-xl font-bold mb-4">Contact information</h2>
          <div className="mb-4">
            E-Mail: matthias@orbal-analytics.com <br />
            Internet address: www.orbal-analytics.com
          </div>
        </div>

        <div className="flex flex-col w-full">
          <h2 className="text-xl font-bold mb-4">Disclaimer</h2>

          <h3 className="text-lg font-bold mb-2">Accountability for content</h3>
          <p className="mb-4">
            The contents of our pages have been created with the utmost care.
            However, we cannot guarantee the contents accuracy, completeness or
            topicality. According to statutory provisions, we are furthermore
            responsible for our own content on these web pages. In this matter,
            please note that we are not obliged to monitor the transmitted or
            saved information of third parties, or investigate circumstances
            pointing to illegal activity. Our obligations to remove or block the
            use of information under generally applicable laws remain unaffected
            by this as per §§ 8 to 10 of the Telemedia Act (TMG).
          </p>

          <h3 className="text-lg font-bold mb-2">Accountability for links</h3>
          <p className="mb-4">
            Responsibility for the content of external links (to web pages of
            third parties) lies solely with the operators of the linked pages.
            No violations were evident to us at the time of linking. Should any
            legal infringement become known to us, we will remove the respective
            link immediately.
          </p>

          <h3 className="text-lg font-bold mb-2">Copyright</h3>
          <p className="mb-4">
            Our web pages and their contents are subject to German copyright
            law. Unless expressly permitted by law, every form of utilizing,
            reproducing or processing works subject to copyright protection on
            our web pages requires the prior consent of the respective owner of
            the rights. Individual reproductions of a work are only allowed for
            private use. The materials from these pages are copyrighted and any
            unauthorized use may violate copyright laws.
          </p>

          <p className="mb-4">Source: Englisch-Übersetzung translate-24h.de</p>
        </div>
      </div>
    </Container>
  );
};

export default Imprint;
