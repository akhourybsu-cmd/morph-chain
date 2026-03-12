import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [stage, setStage] = useState<"enter" | "idle">("enter");
  const prevKey = useRef(location.key);

  useEffect(() => {
    if (location.key !== prevKey.current) {
      prevKey.current = location.key;
      setStage("enter");
      setDisplayChildren(children);
    } else {
      setDisplayChildren(children);
    }
  }, [children, location.key]);

  useEffect(() => {
    if (stage === "enter") {
      const t = setTimeout(() => setStage("idle"), 300);
      return () => clearTimeout(t);
    }
  }, [stage]);

  return (
    <div
      className={stage === "enter" ? "animate-page-enter" : ""}
      style={{ minHeight: "100vh" }}
    >
      {displayChildren}
    </div>
  );
};
