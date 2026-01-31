// Script to add proper session validation to API routes
const fs = require('fs');
const path = require('path');

// List of files that need fixing
const filesToFix = [
  'src/app/api/shipments/route.ts',
  'src/app/api/boxes/route.ts',
  'src/app/api/picker-links/route.ts'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Add enhanced session validation
    const sessionCheck = `
    // Enhanced session validation
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!session.user) {
      return NextResponse.json(
        { error: 'Invalid session structure' },
        { status: 401 }
      )
    }

    if (!session.user.id) {
      return NextResponse.json(
        { error: 'Session missing user ID' },
        { status: 401 }
      )
    }

    // PACKER users should use PACKER-specific endpoints
    if (session.user.role === 'PACKER') {
      return NextResponse.json(
        { 
          error: 'PACKER users should use PACKER-specific endpoints',
          suggestion: 'Please use the appropriate PACKER API endpoint'
        },
        { status: 403 }
      )
    }`;

    // Find and replace the basic session check
    const basicSessionCheck = /if \(!session\?\.user\) \{[\s\S]*?\{[\s\S]*?status: 401[\s\S]*?\}\s*\}/g;
    
    if (basicSessionCheck.test(content)) {
      content = content.replace(basicSessionCheck, sessionCheck);
      fs.writeFileSync(fullPath, content);
      console.log(`Fixed session validation in ${filePath}`);
    } else {
      console.log(`No basic session check found in ${filePath}`);
    }
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('Session validation fixes completed!');
