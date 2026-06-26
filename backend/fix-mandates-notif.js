/**
 * Fix broken message strings and duplicate catch block in mandates.ts notification code.
 */
const fs = require('fs');
const file = 'src/routes/mandates.ts';
let c = fs.readFileSync(file, 'utf8');

// Fix broken message strings (missing backtick quotes)
const badMsg1 = 'message: Your mandate "{mandateTitle}" has been submitted and is pending admin approval.,';
const goodMsg1 = 'message: `Your mandate "${_mandateTitle}" has been submitted and is pending admin approval.`,';

const badMsg2 = 'message: ${companyName} has posted a new mandate: "{mandateTitle}". Review it in the admin panel.,';
const goodMsg2 = 'message: `${companyName} has posted a new mandate: "${_mandateTitle}". Review it in the admin panel.`,';

// Also fix variable names to match what the PowerShell script used
const badVar1 = 'message: `Your mandate "${mandateTitle}"';
const goodVar1 = 'message: `Your mandate "${_mandateTitle}"';
const badVar2 = 'message: `${companyName} has posted a new mandate: "${mandateTitle}"';
const goodVar2 = 'message: `${companyName} has posted a new mandate: "${_mandateTitle}"';

if (c.includes(badMsg1)) {
  c = c.replace(badMsg1, goodMsg1);
  console.log('Fixed poster message string');
} else if (c.includes(badVar1)) {
  c = c.replace(badVar1, goodVar1);
  console.log('Fixed poster message variable');
} else {
  console.log('WARNING: poster message string not found');
}

if (c.includes(badMsg2)) {
  c = c.replace(badMsg2, goodMsg2);
  console.log('Fixed admin message string');
} else if (c.includes(badVar2)) {
  c = c.replace(badVar2, goodVar2);
  console.log('Fixed admin message variable');
} else {
  console.log('WARNING: admin message string not found');
}

// Remove the duplicate catch block that follows the already-added catch
// Pattern: after `});` (end of IIFE), there's a second `} catch ... }` + `});`
const dupCatch = `  } catch (err: any) {\n    return serverError(res, err.message);\n  }\n});\n  } catch (err: any) {\n    return serverError(res, err.message);\n  }\n});`;
const fixedCatch = `  } catch (err: any) {\n    return serverError(res, err.message);\n  }\n});`;

if (c.includes(dupCatch)) {
  c = c.replace(dupCatch, fixedCatch);
  console.log('Removed duplicate catch block');
} else {
  // Try CRLF variant
  const dupCatchCRLF = `  } catch (err: any) {\r\n    return serverError(res, err.message);\r\n  }\r\n});\r\n  } catch (err: any) {\r\n    return serverError(res, err.message);\r\n  }\r\n});`;
  const fixedCatchCRLF = `  } catch (err: any) {\r\n    return serverError(res, err.message);\r\n  }\r\n});`;
  if (c.includes(dupCatchCRLF)) {
    c = c.replace(dupCatchCRLF, fixedCatchCRLF);
    console.log('Removed duplicate catch block (CRLF)');
  } else {
    // Count occurrences
    const count = (c.match(/} catch \(err/g) || []).length;
    console.log('WARNING: could not find dup catch; total catch blocks:', count);
    // Show the area around the issue
    const idx = c.lastIndexOf('} catch (err');
    console.log('Last catch at index', idx, '— context:', JSON.stringify(c.substring(Math.max(0,idx-50), idx+100)));
  }
}

fs.writeFileSync(file, c, 'utf8');
console.log('mandates.ts saved');
