export const today = new Date().toISOString().split("T")[0];

//--------------------------------------------------------------------------
// Functions
//--------------------------------------------------------------------------
export const isNumeric = (value: string) => {
  const num = Number(value);
  return typeof num === "number" && !Number.isNaN(num);
};
