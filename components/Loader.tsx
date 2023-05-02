import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const Loader = () => {
  const [numRootkeys, setNumRootkeys] = useState(0);
  const [show, setShow] = useState(true);

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
