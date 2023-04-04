import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useMetricsData } from "@/context/MetricsProvider";

const Loader = () => {
  const metricsData = useMetricsData();

  const [numRootkeys, setNumRootkeys] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (metricsData.status === "success") {
      const numkeys = Object.keys(metricsData.data).length;
      setNumRootkeys(numkeys);

      if (numkeys >= 10) {
        setTimeout(() => {
          setShow(false);
        }, 5000);
      }

      // if (metricsData.rootKeys.length >= 6) {
      //   // remove the main loader after the page has loaded
      //   setTimeout(() => {
      //     const mainLoader = document.getElementById("main-loader");
      //     if (mainLoader) {
      //       mainLoader.remove();
      //     }
      //   }, 500);
      // }
    }
  }, [metricsData]);

  if (!show) return null;

  return (
    <motion.div
      id="main-loader"
      className="fixed inset-0 flex items-center justify-center  z-50 w-full h-full"
      initial={{ opacity: 1 }}
      animate={{
        opacity: 0,
        transitionEnd: {
          display: "none",
        },
      }}
      transition={{ duration: 0.33, delay: 4 }}
      exit={{ opacity: 0 }}
    >
      <div>
        <motion.div
          className="animate-bounce rounded-full h-32 w-32 border-8 border-gray-900 "
          initial={{ y: 0 }}
          animate={{ y: 10 }}
          transition={{
            repeat: Infinity,
            type: "spring",
            stiffness: 100,
          }}
        ></motion.div>
        {numRootkeys}
      </div>
    </motion.div>
  );
};

export default Loader;
