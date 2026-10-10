window.renderInvoice=async(base64,id,options={})=>{
  const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
  const file=new File([bytes],'invoice.xml',{type:'application/xml'});
  const converter=window['ksef-fe-invoice-converter'];
  const data={nrKSeF:id};
  if(options.environment!=='prod')data.watermark='ŚRODOWISKO TESTOWE — NIE JEST FAKTURĄ PRODUKCYJNĄ';
  if(options.qrCode)data.qrCode=options.qrCode;
  if(options.acDate)data.acDate=options.acDate;
  return converter.generateInvoice(file,data,'base64');
};
