export const APP_NAME = "BillBook";

export const UNIT_OPTIONS = [
  { value: "NOS", label: "Nos (Numbers)" },
  { value: "KGS", label: "Kgs (Kilograms)" },
  { value: "LTR", label: "Ltr (Litres)" },
  { value: "MTR", label: "Mtr (Metres)" },
  { value: "SQF", label: "Sq. Ft" },
  { value: "SQM", label: "Sq. Mtr" },
  { value: "TON", label: "Tonnes" },
  { value: "PKT", label: "Packets" },
  { value: "BOX", label: "Box" },
  { value: "SET", label: "Set" },
  { value: "PRS", label: "Pairs" },
  { value: "OTH", label: "Others" },
] as const;

export const DOCUMENT_TYPES = [
  { label: "GST Invoice", value: "gst_invoice" },
  { label: "Non-GST Invoice", value: "non_gst_invoice" },
  { label: "Quotation", value: "quotation" },
  { label: "Proforma Invoice", value: "proforma_invoice" },
] as const;

export const PAYMENT_MODES = ["cash", "bank_transfer", "upi", "cheque"] as const;

export const GST_OPTIONS = [0, 5, 12, 18, 28] as const;

export const STATE_CODES = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "25", name: "Daman and Diu" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "28", name: "Andhra Pradesh (Old)" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
  { code: "97", name: "Other Territory" },
  { code: "99", name: "Centre Jurisdiction" },
] as const;
