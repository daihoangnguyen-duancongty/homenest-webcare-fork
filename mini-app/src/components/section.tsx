import { PropsWithChildren, ReactNode } from 'react';

export interface SectionProps {
  title: ReactNode;
  className?: string; // className sẽ áp dụng cho phần chứa title
  onClick?: () => void;
}

export default function Section(props: PropsWithChildren<SectionProps>) {
  return (
    <div className="" onClick={props.onClick}>
      <div className="flex items-center justify-between px-2">
        <div className={`w-full p-2 pt-3 font-medium truncate ${props.className ?? ''}`}>
          {props.title}
        </div>
      </div>
      {props.children}
    </div>
  );
}
