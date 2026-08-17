/**
 * Turn a CSV string from the API into a browser download.
 *
 * The export endpoints return the CSV as a JSON string rather than a
 * raw file response - WP's REST serializer mangles the latter - so the
 * file has to be assembled client-side.
 *
 * Shared by the orders and tickets exports so the encoding details
 * (notably the BOM) can't drift between them.
 */

/**
 * UTF-8 byte order mark.
 *
 * Excel assumes the system codepage for a CSV without one, so a buyer
 * called "Jegathees" is fine but anything accented arrives mojibaked.
 * Built from its code point rather than written literally: the
 * character is invisible in source and editors strip it silently.
 */
const BOM = String.fromCharCode(0xfeff);

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
