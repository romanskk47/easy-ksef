import React,{forwardRef} from 'react';
import {ChevronDown} from 'lucide-react';

// Keep the platform's accessible select interaction and use one consistent arrow.
const SelectControl=forwardRef(function SelectControl({children,className='',...props},ref){
 return <span className="select-control"><select ref={ref} className={className} {...props}>{children}</select><ChevronDown aria-hidden="true"/></span>;
});
export default SelectControl;
