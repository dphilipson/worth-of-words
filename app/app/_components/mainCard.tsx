import clsx from "clsx";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import { memo, ReactNode } from "react";

import Card, { CardProps } from "./card";

export interface MainCardProps extends Omit<CardProps, "isFullWidth"> {
  title: string;
  image: StaticImport;
  imageAlt: string;
}

export default memo(function MainCard({
  title,
  image,
  imageAlt,
  className,
  children,
  ...cardProps
}: MainCardProps): ReactNode {
  return (
    <Card
      className={clsx(className, "mt-16 items-center text-center lg:p-16")}
      isFullWidth={true}
      {...cardProps}
    >
      <Image className="w-full" src={image} alt={imageAlt} />
      <h1 className="mb-0">{title}</h1>
      {children}
    </Card>
  );
});
