import { BRAND, REGION } from "../constants/env";
import React, { type ReactNode } from "react";

interface ConditionalProps {
  children?: ReactNode;
  brand?: string;
  region?: string;
  if?: boolean;
}

export function Conditional(props: ConditionalProps) {
  const { children, brand, region } = props;
  if (
    (!brand || brand === BRAND) &&
    (!region || region === REGION) &&
    (props.if === undefined || props.if)
  ) {
    return <>{children}</>;
  } else {
    return null;
  }
}
