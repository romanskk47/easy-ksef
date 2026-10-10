import React from 'react';
import {Button} from './ui/button';
export default function IconButton({label,children,...props}){
 return <Button type="button" variant="outline" size="icon" aria-label={label} title={label} {...props}>{children}</Button>;
}
