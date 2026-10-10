import React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
// The shadcn range composition, styled with the application's desktop tokens.
export function Slider({value,labels,valueText,...props}){
 return <SliderPrimitive.Root className="amount-slider" value={value} {...props}><SliderPrimitive.Track className="amount-slider-track"><SliderPrimitive.Range className="amount-slider-range"/></SliderPrimitive.Track>{value.map((v,i)=><SliderPrimitive.Thumb key={i} className="amount-slider-thumb" aria-label={labels[i]} aria-valuetext={valueText(v)}/>)}</SliderPrimitive.Root>;
}
