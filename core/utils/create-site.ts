
// =============================================================================
// CLI INTERFACE AND MAIN EXECUTION
// =============================================================================

async function showIndustryOptions(): Promise<void> {
  console.log(colors.cyan('\n🏭 Available Industry Templates:\n'));

  Object.entries(INDUSTRY_TEMPLATES).forEach(([key, template], index) => {
    console.log(colors.blue(`${index + 1}. ${template.name}`));
    console.log(colors.gray(`   ${template.description}`));
    console.log(colors.gray(`   Default features: ${template.defaultFeatures.slice(0, 3).join(', ')}${template.defaultFeatures.length > 3 ? '...' : ''}`));
    console.log('');
  });
}

async function promptForConfiguration(): Promise<SiteConfiguration> {
  console.log(colors.cyan('\n🚀 Deno Genesis Site Creator'));
  console.log(colors.gray('Following Unix Philosophy: Do one thing well - create industry-specific sites\n'));

  // Show available industries
  await showIndustryOptions();

  // Get user input (in a real implementation, you'd use a proper CLI library)
  console.log(colors.yellow('Please provide the following information:'));
  console.log(colors.gray('(In a full implementation, this would be an interactive prompt)\n'));

  // For now, return a sample configuration
  // In a real implementation, you'd collect this interactively
  throw new Error('Interactive mode not implemented. Please use command-line arguments.');
}

async function main(): Promise<void> {
  const args = parseArgs(Deno.args, {
    string: ['name', 'business', 'domain', 'industry', 'email', 'phone', 'address', 'author'],
    boolean: ['help', 'list-industries', 'interactive'],
    alias: {
      h: 'help',
      n: 'name',
      b: 'business',
      d: 'domain',
      i: 'industry',
      e: 'email',
      p: 'phone',
      a: 'author'
    }
  });

  // Show help
  if (args.help) {
    console.log(`
${colors.cyan('Deno Genesis Site Creator')}
${colors.gray('Create new business sites with industry-specific templates')}

${colors.yellow('Usage:')}
  dgf-create-site --name <site-name> --business <business-name> --industry <industry> [options]

${colors.yellow('Required Options:')}
  --name, -n        Site name (lowercase, hyphens only)
  --business, -b    Business name
  --industry, -i    Industry template (see --list-industries)
  --email, -e       Business email address
  --author, -a      Author name

${colors.yellow('Optional:')}
  --domain, -d      Primary domain name
  --phone, -p       Business phone number
  --address         Business address

${colors.yellow('Commands:')}
  --list-industries Show available industry templates
  --interactive     Interactive mode (prompt for all options)
  --help, -h        Show this help message

${colors.yellow('Examples:')}
  # Construction/Roofing site
  dgf-create-site --name acme-roofing --business "Acme Roofing LLC" \\
    --industry construction-roofing --email info@acmeroofing.com \\
    --author "John Smith" --domain acmeroofing.com

  # Professional services site
  dgf-create-site --name smith-law --business "Smith & Associates Law" \\
    --industry professional-services --email contact@smithlaw.com \\
    --author "Jane Smith" --phone "(555) 123-4567"

  # Developer community site
  dgf-create-site --name techcommunity --business "Local Tech Community" \\
    --industry developer-community --email hello@techcommunity.org \\
    --author "Community Organizer"

${colors.yellow('Available Industries:')}
${Object.keys(INDUSTRY_TEMPLATES).map(key => `  • ${key}`).join('\n')}

${colors.gray('For more information, visit: https://github.com/dominguez-tech/deno-genesis')}
`);
    return;
  }

  // List industries
  if (args['list-industries']) {
    await showIndustryOptions();
    return;
  }

  // Interactive mode
  if (args.interactive) {
    try {
      const config = await promptForConfiguration();
      await createSiteFromConfig(config);
    } catch (error) {
      console.error(colors.red(`Error in interactive mode: ${error.message}`));
      Deno.exit(1);
    }
    return;
  }

  // Validate required arguments
  const requiredArgs = ['name', 'business', 'industry', 'email', 'author'];
  const missingArgs = requiredArgs.filter(arg => !args[arg]);

  if (missingArgs.length > 0) {
    console.error(colors.red('Missing required arguments: ' + missingArgs.join(', ')));
    console.log(colors.yellow('Use --help for usage information'));
    Deno.exit(1);
  }

  // Validate industry
  if (!INDUSTRY_TEMPLATES[args.industry]) {
    console.error(colors.red(`Invalid industry: ${args.industry}`));
    console.log(colors.yellow('Use --list-industries to see available options'));
    Deno.exit(1);
  }

  try {
    // Get next available port
    const port = await getNextAvailablePort();

    // Create configuration
    const config: SiteConfiguration = {
      siteName: args.name,
      businessName: args.business,
      domain: args.domain || `${args.name}.local`,
      port: port,
      industry: args.industry,
      template: INDUSTRY_TEMPLATES[args.industry],
      features: INDUSTRY_TEMPLATES[args.industry].defaultFeatures,
      author: args.author,
      email: args.email,
      phone: args.phone,
      address: args.address
    };

    // Create the site
    await createSiteFromConfig(config);

  } catch (error) {
    console.error(colors.red(`Site creation failed: ${error.message}`));
    Deno.exit(1);
  }
}

async function createSiteFromConfig(config: SiteConfiguration): Promise<void> {
  const creator = new SiteCreator(config);
  const result = await creator.create();

  if (result.success) {
    console.log(colors.green(`\n✅ Site created successfully!`));
    console.log(colors.cyan('\n📋 Summary:'));
    console.log(`   Site: ${result.siteName}`);
    console.log(`   Port: ${result.port}`);
    console.log(`   Industry: ${config.template.name}`);
    console.log(`   Directory: ${result.siteDirectory}`);

    console.log(colors.cyan('\n🔄 Next Steps:'));
    result.nextSteps.forEach(step => {
      if (step.startsWith('🔄') || step.startsWith('📋') || step.startsWith('🔗') || step.startsWith('📚') || step.startsWith('🛠️')) {
        console.log(colors.yellow(step));
      } else if (step.startsWith('•')) {
        console.log(colors.gray(step));
      } else if (step.match(/^\d+\./)) {
        console.log(colors.blue(step));
      } else {
        console.log(step);
      }
    });

    if (result.warnings.length > 0) {
      console.log(colors.yellow('\n⚠️  Warnings:'));
      result.warnings.forEach(warning => console.log(colors.yellow(`   ${warning}`)));
    }

  } else {
    console.log(colors.red(`\n❌ Site creation failed!`));
    if (result.errors.length > 0) {
      console.log(colors.red('\nErrors:'));
      result.errors.forEach(error => console.log(colors.red(`   ${error}`)));
    }

    console.log(colors.cyan('\nSteps completed:'));
    result.steps.forEach(step => {
      const status = step.status === 'completed' ? '✅' :
                     step.status === 'failed' ? '❌' :
                     step.status === 'running' ? '🔄' : '⏸️';
      console.log(`   ${status} ${step.name}${step.duration ? ` (${step.duration}ms)` : ''}`);
      if (step.message) {
        console.log(colors.gray(`      ${step.message}`));
      }
    });

    Deno.exit(1);
  }
}

// Utility functions
function toPascalCase(str: string): string {
  return str.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Run the main function if this file is executed directly
if (import.meta.main) {
  await main();
}"/>
  <text x="16" y="20" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="white">
    ${this.config.businessName.charAt(0).toUpperCase()}
  </text>
</svg>`;

    await Deno.writeTextFile(`${this.result.siteDirectory}/public/favicon.svg`, faviconSVG);

    // Create robots.txt
    const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://${this.config.domain}/sitemap.xml
`;

    await Deno.writeTextFile(`${this.result.siteDirectory}/public/robots.txt`, robotsTxt);
  }

  private async generateIndustryTemplates(): Promise<void> {
    // Create industry-specific component templates
    await this.createIndustryComponents();

    // Create sample data files
    await this.createSampleData();
  }

  private async createIndustryComponents(): Promise<void> {
    const template = this.config.template;

    // Create a reusable component template based on industry
    const componentContent = `/**
 * Industry-specific components for ${this.config.businessName}
 * Industry: ${template.name}
 */

export class ${this.toPascalCase(this.config.industry)}Components {

  static generateServiceCard(service: { title: string; description: string; price?: string }) {
    return \`
      <div class="service-card">
        <h3>\${service.title}</h3>
        <p>\${service.description}</p>
        \${service.price ? \`<div class="service-price">\${service.price}</div>\` : ''}
        <a href="/contact" class="service-cta">Learn More</a>
      </div>
    \`;
  }

  static generateContactInfo(config: any) {
    return \`
      <div class="contact-info-widget">
        <h3>Contact Information</h3>
        <div class="contact-item">
          <strong>Email:</strong> \${config.contact.email}
        </div>
        \${config.contact.phone ? \`
        <div class="contact-item">
          <strong>Phone:</strong> \${config.contact.phone}
        </div>\` : ''}
        \${config.contact.address ? \`
        <div class="contact-item">
          <strong>Address:</strong> \${config.contact.address}
        </div>\` : ''}
      </div>
    \`;
  }

  ${this.generateIndustrySpecificComponents(template)}
}

// Export for use in routes
export default ${this.toPascalCase(this.config.industry)}Components;
`;

    await Deno.writeTextFile(`${this.result.siteDirectory}/components/industry-components.ts`, componentContent);
  }

  private generateIndustrySpecificComponents(template: IndustryTemplate): string {
    switch (this.config.industry) {
      case 'construction-roofing':
        return `
  static generateEmergencyBanner() {
    return \`
      <div class="emergency-banner">
        🚨 24/7 Emergency Roofing Services Available - Call Now!
      </div>
    \`;
  }

  static generateWeatherAlert(weatherData: any) {
    return \`
      <div class="weather-alert">
        <h4>Weather Advisory</h4>
        <p>Current conditions: \${weatherData.condition}</p>
        <p>Impact on roofing work: \${weatherData.impact}</p>
      </div>
    \`;
  }`;

      case 'healthcare-beauty':
        return `
  static generateAppointmentSlots(availableSlots: string[]) {
    return \`
      <div class="appointment-slots">
        <h4>Available Times</h4>
        <div class="time-grid">
          \${availableSlots.map(slot => \`
            <button class="time-slot" data-time="\${slot}">\${slot}</button>
          \`).join('')}
        </div>
      </div>
    \`;
  }

  static generatePrivacyNotice() {
    return \`
      <div class="privacy-notice">
        <p><strong>Privacy Notice:</strong> Your health information is protected under HIPAA. We maintain strict confidentiality of all patient data.</p>
      </div>
    \`;
  }`;

      case 'developer-community':
        return `
  static generateEventCard(event: any) {
    return \`
      <div class="event-card">
        <h4>\${event.title}</h4>
        <div class="event-meta">
          <span class="event-date">\${event.date}</span>
          <span class="event-location">\${event.location}</span>
        </div>
        <p>\${event.description}</p>
        <div class="event-tags">
          \${event.tags.map((tag: string) => \`<span class="tech-tag">\${tag}</span>\`).join('')}
        </div>
      </div>
    \`;
  }  private generateConsultationHandler(template: IndustryTemplate): string {
    return `/**
 * Consultation Request Handler for ${this.config.businessName}
 * Industry: ${template.name}
 */

import { SITE_CONFIG } from "../site-config.ts";

export async function consultationHandler(request: Request): Promise<Response> {
  if (request.method === 'POST') {
    return await handleConsultationSubmission(request);
  }

  const html = \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Schedule Consultation - \${SITE_CONFIG.businessName}</title>
    <link rel="stylesheet" href="/public/css/main.css">
</head>
<body>
    <header class="header">
        <nav class="nav container">
            <div class="nav-brand">
                <h1>\${SITE_CONFIG.businessName}</h1>
            </div>
            <ul class="nav-menu">
                <li><a href="/" class="nav-link">Home</a></li>
                <li><a href="/services" class="nav-link">Services</a></li>
                <li><a href="/about" class="nav-link">About</a></li>
                <li><a href="/contact" class="nav-link">Contact</a></li>
                <li><a href="/consultation" class="nav-link active">Consultation</a></li>
            </ul>
        </nav>
    </header>

    <main class="consultation-page">
        <div class="container">
            <section class="consultation-hero">
                <h1>Schedule Your Consultation</h1>
                <p>Professional consultation to discuss your specific needs and requirements</p>
            </section>

            <form class="consultation-form" method="POST" action="/consultation">
                <div class="form-section">
                    <h2>Contact Information</h2>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="name">Full Name *</label>
                            <input type="text" id="name" name="name" required>
                        </div>
                        <div class="form-group">
                            <label for="company">Company/Organization</label>
                            <input type="text" id="company" name="company">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="email">Email *</label>
                            <input type="email" id="email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="phone">Phone *</label>
                            <input type="tel" id="phone" name="phone" required>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h2>Consultation Details</h2>
                    <div class="form-group">
                        <label for="consultationType">Consultation Type *</label>
                        <select id="consultationType" name="consultationType" required>
                            <option value="">Select consultation type</option>
                            <option value="initial">Initial Consultation</option>
                            <option value="strategy">Strategic Planning</option>
                            <option value="compliance">Compliance Review</option>
                            <option value="implementation">Implementation Planning</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="description">Project Description *</label>
                        <textarea id="description" name="description" rows="4" required
                                  placeholder="Please describe your project or consultation needs..."></textarea>
                    </div>

                    <div class="form-group">
                        <label for="urgency">Priority Level</label>
                        <select id="urgency" name="urgency">
                            <option value="normal">Normal</option>
                            <option value="high">High Priority</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Request Consultation</button>
                    <p class="form-note">* Required fields. We'll contact you within 1 business day.</p>
                </div>
            </form>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-bottom">
                <p>&copy; \${new Date().getFullYear()} \${SITE_CONFIG.businessName}. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>\`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

async function handleConsultationSubmission(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const consultationData = {
      name: formData.get('name')?.toString() || '',
      company: formData.get('company')?.toString() || '',
      email: formData.get('email')?.toString() || '',
      phone: formData.get('phone')?.toString() || '',
      consultationType: formData.get('consultationType')?.toString() || '',
      description: formData.get('description')?.toString() || '',
      urgency: formData.get('urgency')?.toString() || 'normal',
      timestamp: new Date().toISOString(),
      site: SITE_CONFIG.siteName
    };

    if (!consultationData.name || !consultationData.email || !consultationData.description) {
      return new Response('Missing required fields', { status: 400 });
    }

    console.log('Consultation request:', consultationData);

    return new Response(JSON.stringify({
      success: true,
      message: 'Your consultation request has been submitted. We will contact you within 1 business day.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Consultation form error:', error);
    return new Response('Error processing consultation request', { status: 500 });
  }
}`;
  }

  private async createPublicAssets(): Promise<void> {
    // Create main CSS file with industry-specific styling
    await this.createMainCSS();

    // Create main JavaScript file
    await this.createMainJS();

    // Create placeholder favicon
    await this.createFavicon();
  }

  private async createMainCSS(): Promise<void> {
    const template = this.config.template;

    const cssContent = `/*
 * =============================================================================
 * ${this.config.businessName} - Main Stylesheet
 * =============================================================================
 *
 * Industry: ${template.name}
 * Framework: Deno Genesis v2.0.0
 * Design Philosophy: Professional warmth with industry-appropriate styling
 *
 * Color Scheme:
 * Primary: ${template.primaryColor}
 * Accent: ${template.accentColor}
 * Background: ${template.backgroundColor}
 */

/* =============================================================================
   CSS RESET & BASE STYLES
   ============================================================================= */

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  color: #1f2937;
  background-color: ${template.backgroundColor};
}

/* =============================================================================
   TYPOGRAPHY
   ============================================================================= */

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  line-height: 1.2;
  color: #111827;
  margin-bottom: 0.5em;
}

h1 { font-size: 2.5rem; }
h2 { font-size: 2rem; }
h3 { font-size: 1.5rem; }
h4 { font-size: 1.25rem; }

p {
  margin-bottom: 1rem;
  color: #4b5563;
}

a {
  color: ${template.primaryColor};
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: ${template.accentColor};
}

/* =============================================================================
   LAYOUT COMPONENTS
   ============================================================================= */

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.section {
  padding: 4rem 0;
}

/* =============================================================================
   HEADER & NAVIGATION
   ============================================================================= */

.header {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
}

.nav-brand h1 {
  color: ${template.primaryColor};
  font-size: 1.5rem;
  margin-bottom: 0;
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  font-weight: 500;
  color: #4b5563;
  transition: color 0.2s ease;
}

.nav-link:hover,
.nav-link.active {
  color: ${template.primaryColor};
}

.nav-link.cta {
  background: ${template.accentColor};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.nav-link.cta:hover {
  background: ${this.darkenColor(template.accentColor, 10)};
  color: white;
}

/* =============================================================================
   HERO SECTION
   ============================================================================= */

.hero {
  background: linear-gradient(135deg, ${template.primaryColor}f0 0%, ${template.primaryColor}d0 100%);
  padding: 6rem 0;
  text-align: center;
  color: white;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: white;
}

.hero-subtitle {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  color: rgba(255, 255, 255, 0.9);
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* =============================================================================
   BUTTONS
   ============================================================================= */

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  text-align: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn-primary {
  background: ${template.accentColor};
  color: white;
}

.btn-primary:hover {
  background: ${this.darkenColor(template.accentColor, 10)};
  color: white;
  transform: translateY(-2px);
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background: white;
  color: ${template.primaryColor};
}

/* =============================================================================
   SECTIONS
   ============================================================================= */

.features {
  padding: 6rem 0;
}

.section-title {
  text-align: center;
  margin-bottom: 3rem;
  color: #111827;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card,
.service-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.feature-card:hover,
.service-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.feature-card h3,
.service-card h3 {
  color: ${template.primaryColor};
  margin-bottom: 1rem;
}

.service-link {
  color: ${template.accentColor};
  font-weight: 600;
  margin-top: 1rem;
  display: inline-block;
}

/* =============================================================================
   CTA SECTIONS
   ============================================================================= */

.cta-section {
  background: ${template.primaryColor};
  padding: 4rem 0;
  text-align: center;
}

.cta-content h2 {
  color: white;
  margin-bottom: 1rem;
}

.cta-content p {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

/* =============================================================================
   FORMS
   ============================================================================= */

.contact-form,
.quote-form,
.appointment-form,
.consultation-form {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 2rem;
}

.form-section h2 {
  color: ${template.primaryColor};
  margin-bottom: 1.5rem;
  border-bottom: 2px solid ${template.primaryColor}20;
  padding-bottom: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: ${template.primaryColor};
}

.form-actions {
  text-align: center;
  margin-top: 2rem;
}

.form-note {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

/* =============================================================================
   FOOTER
   ============================================================================= */

.footer {
  background: #1f2937;
  color: white;
  padding: 3rem 0 1rem;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-section h3 {
  color: white;
  margin-bottom: 1rem;
}

.footer-section ul {
  list-style: none;
}

.footer-section ul li {
  margin-bottom: 0.5rem;
}

.footer-section a {
  color: #d1d5db;
}

.footer-section a:hover {
  color: white;
}

.footer-bottom {
  border-top: 1px solid #374151;
  padding-top: 1rem;
  text-align: center;
  color: #9ca3af;
}

/* =============================================================================
   PAGE-SPECIFIC STYLES
   ============================================================================= */

.contact-page,
.services-page,
.about-page,
.quote-page,
.appointment-page,
.consultation-page {
  padding-top: 2rem;
}

.contact-hero,
.services-hero,
.about-hero,
.quote-hero,
.appointment-hero,
.consultation-hero {
  text-align: center;
  padding: 3rem 0;
  background: ${template.backgroundColor};
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  margin-bottom: 3rem;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.contact-item h3 {
  color: ${template.primaryColor};
  margin-bottom: 0.5rem;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.value-item {
  text-align: center;
  padding: 1.5rem;
}

.value-item h3 {
  color: ${template.primaryColor};
  margin-bottom: 1rem;
}

.benefits-list {
  list-style: none;
  max-width: 500px;
  margin: 0 auto;
}

.benefits-list li {
  padding: 0.5rem 0;
  position: relative;
  padding-left: 2rem;
}

.benefits-list li:before {
  content: "✓";
  position: absolute;
  left: 0;
  color: ${template.accentColor};
  font-weight: bold;
}

/* =============================================================================
   RESPONSIVE DESIGN
   ============================================================================= */

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .nav-menu {
    flex-direction: column;
    gap: 1rem;
  }

  .contact-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .features-grid,
  .services-grid {
    grid-template-columns: 1fr;
  }

  .container {
    padding: 0 0.5rem;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 4rem 0;
  }

  .hero-title {
    font-size: 1.75rem;
  }

  .nav {
    flex-direction: column;
    gap: 1rem;
  }

  .features {
    padding: 3rem 0;
  }

  .section {
    padding: 2rem 0;
  }
}

/* =============================================================================
   INDUSTRY-SPECIFIC ENHANCEMENTS
   ============================================================================= */

${this.generateIndustrySpecificCSS(template)}
`;

    await Deno.writeTextFile(`${this.result.siteDirectory}/public/css/main.css`, cssContent);
  }

  private generateIndustrySpecificCSS(template: IndustryTemplate): string {
    switch (this.config.industry) {
      case 'construction-roofing':
        return `
/* Construction & Roofing Industry Enhancements */
.emergency-banner {
  background: ${template.accentColor};
  color: white;
  padding: 0.5rem;
  text-align: center;
  font-weight: 600;
}

.urgency-indicator {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
}

.urgency-normal { background: #10b981; color: white; }
.urgency-urgent { background: #f59e0b; color: white; }
.urgency-emergency { background: #ef4444; color: white; }

.weather-widget {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
  color: white;
}`;

      case 'healthcare-beauty':
        return `
/* Healthcare & Beauty Industry Enhancements */
.appointment-times {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  margin: 1rem 0;
}

.time-slot {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-slot:hover {
  border-color: ${template.primaryColor};
  background: ${template.primaryColor}10;
}

.time-slot.selected {
  background: ${template.primaryColor};
  color: white;
  border-color: ${template.primaryColor};
}

.privacy-notice {
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 1rem;
}`;

      case 'developer-community':
        return `
/* Developer Community Enhancements */
.code-snippet {
  background: #1f2937;
  color: #e5e7eb;
  padding: 1rem;
  border-radius: 6px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.875rem;
  overflow-x: auto;
}

.event-card {
  border-left: 4px solid ${template.accentColor};
  padding-left: 1rem;
}

.tech-tag {
  display: inline-block;
  background: ${template.primaryColor}20;
  color: ${template.primaryColor};
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  margin: 0.25rem;
}

.member-badge {
  background: ${template.accentColor};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}`;

      default:
        return `/* Default industry styling */`;
    }
  }

  private darkenColor(color: string, percent: number): string {
    // Simple color darkening function
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.round(255 * percent / 100));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.round(255 * percent / 100));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.round(255 * percent / 100));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private async createMainJS(): Promise<void> {
    const jsContent = `/**
 * ${this.config.businessName} - Main JavaScript
 * Industry: ${this.config.template.name}
 * Framework: Deno Genesis v2.0.0
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize application
    initializeApp();

    // Setup form handling
    setupFormHandlers();

    // Setup navigation
    setupNavigation();

    // Industry-specific initialization
    ${this.generateIndustrySpecificJS()}
});

function initializeApp() {
    console.log('${this.config.businessName} application initialized');

    // Add mobile menu toggle if needed
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
}

function setupFormHandlers() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmission);
    });
}

async function handleFormSubmission(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    // Show loading state
    submitButton.textContent = 'Submitting...';
    submitButton.disabled = true;

    try {
        const formData = new FormData(form);
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showMessage('success', result.message);
            form.reset();
        } else {
            showMessage('error', result.message || 'An error occurred');
        }
    } catch (error) {
        console.error('Form submission error:', error);
        showMessage('error', 'An error occurred while submitting the form');
    } finally {
        // Reset button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

function showMessage(type, message) {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = \`message message-\${type}\`;
    messageDiv.textContent = message;

    // Style the message
    Object.assign(messageDiv.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '6px',
        color: 'white',
        fontWeight: '600',
        zIndex: '1000',
        background: type === 'success' ? '#10b981' : '#ef4444',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    });

    // Add to document
    document.body.appendChild(messageDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);

    // Add click to dismiss
    messageDiv.addEventListener('click', () => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    });
}

function setupNavigation() {
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Active navigation highlighting
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname;

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}

// Utility functions
function formatPhone(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phoneNumber;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export for use in other scripts
window.BusinessApp = {
    showMessage,
    formatPhone,
    validateEmail,
    debounce
};
`;

    await Deno.writeTextFile(`${this.result.siteDirectory}/public/js/main.js`, jsContent);
  }

  private generateIndustrySpecificJS(): string {
    switch (this.config.industry) {
      case 'construction-roofing':
        return `initializeWeatherWidget();
    setupUrgencyHandling();`;

      case 'healthcare-beauty':
        return `initializeAppointmentScheduler();
    setupPrivacyNotices();`;

      case 'developer-community':
        return `initializeCodeHighlighting();
    setupEventCalendar();`;

      default:
        return `// Industry-specific JavaScript initialization`;
    }
  }

  private async createFavicon(): Promise<void> {
    // Create a simple SVG favicon as placeholder
    const faviconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="${this.        'Commercial Moving|Office and business relocations|commercial',
        'Packing Services|Professional packing and unpacking|packing',
        'Storage Solutions|Secure storage facilities|storage',
        'Long Distance|Interstate and long-distance moves|long-distance',
        'Specialty Items|Piano, art, and fragile item moving|specialty',
        'Moving Supplies|Boxes, tape, and moving materials|supplies'
      ]
    };

    const industryServices = servicesByIndustry[this.config.industry] || [];

    return industryServices.map(serviceData => {
      const [title, description, slug] = serviceData.split('|');
      return `<div class="service-card">
                <h3>${title}</h3>
                <p>${description}</p>
                <a href="/contact" class="service-link">Learn More</a>
              </div>`;
    }).join('\n                ');
  }

  private generateAboutHandler(template: IndustryTemplate): string {
    return `/**
 * About Page Handler for ${this.config.businessName}
 * Industry: ${template.name}
 */

import { SITE_CONFIG } from "../site-config.ts";

export async function aboutHandler(request: Request): Promise<Response> {
  const html = \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About Us - \${SITE_CONFIG.businessName}</title>
    <meta name="description" content="Learn about \${SITE_CONFIG.businessName} and our ${template.name.toLowerCase()} expertise">
    <link rel="stylesheet" href="/public/css/main.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <header class="header">
        <nav class="nav container">
            <div class="nav-brand">
                <h1>\${SITE_CONFIG.businessName}</h1>
            </div>
            <ul class="nav-menu">
                <li><a href="/" class="nav-link">Home</a></li>
                <li><a href="/services" class="nav-link">Services</a></li>
                <li><a href="/about" class="nav-link active">About</a></li>
                <li><a href="/contact" class="nav-link">Contact</a></li>
            </ul>
        </nav>
    </header>

    <main class="about-page">
        <div class="container">
            <section class="about-hero">
                <h1>About \${SITE_CONFIG.businessName}</h1>
                <p>Your trusted partner for ${template.name.toLowerCase()} services</p>
            </section>

            <section class="about-content">
                <div class="about-story">
                    <h2>Our Story</h2>
                    <p>${template.sampleContent.aboutSection}</p>
                    <p>We are committed to delivering exceptional results through professional service, attention to detail, and customer satisfaction.</p>
                </div>

                <div class="about-values">
                    <h2>Our Values</h2>
                    <div class="values-grid">
                        <div class="value-item">
                            <h3>Quality</h3>
                            <p>We maintain the highest standards in all our work and services.</p>
                        </div>
                        <div class="value-item">
                            <h3>Reliability</h3>
                            <p>You can count on us to deliver on time and as promised.</p>
                        </div>
                        <div class="value-item">
                            <h3>Integrity</h3>
                            <p>Honest communication and transparent business practices.</p>
                        </div>
                        <div class="value-item">
                            <h3>Service</h3>
                            <p>Customer satisfaction is our top priority in everything we do.</p>
                        </div>
                    </div>
                </div>

                <div class="about-team">
                    <h2>Why Choose Us</h2>
                    <ul class="benefits-list">
                        <li>Experienced and professional team</li>
                        <li>Local business with community focus</li>
                        <li>Competitive pricing and transparent quotes</li>
                        <li>Fully licensed and insured</li>
                        <li>Customer satisfaction guarantee</li>
                        <li>Modern tools and proven methods</li>
                    </ul>
                </div>
            </section>

            <section class="about-cta">
                <div class="cta-content">
                    <h2>Ready to Work Together?</h2>
                    <p>Contact us today to discuss your ${template.name.toLowerCase()} needs.</p>
                    <a href="/contact" class="btn btn-primary">${template.sampleContent.ctaText}</a>
                </div>
            </section>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-bottom">
                <p>&copy; \${new Date().getFullYear()} \${SITE_CONFIG.businessName}. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script src="/public/js/main.js"></script>
</body>
</html>\`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}`;
  }

  private generateQuoteHandler(template: IndustryTemplate): string {
    return `/**
 * Quote Request Handler for ${this.config.businessName}
 * Industry: ${template.name}
 */

import { SITE_CONFIG } from "../site-config.ts";

export async function quoteHandler(request: Request): Promise<Response> {
  if (request.method === 'POST') {
    return await handleQuoteSubmission(request);
  }

  const html = \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Get a Quote - \${SITE_CONFIG.businessName}</title>
    <meta name="description" content="Request a free quote from \${SITE_CONFIG.businessName}">
    <link rel="stylesheet" href="/public/css/main.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <header class="header">
        <nav class="nav container">
            <div class="nav-brand">
                <h1>\${SITE_CONFIG.businessName}</h1>
            </div>
            <ul class="nav-menu">
                <li><a href="/" class="nav-link">Home</a></li>
                <li><a href="/services" class="nav-link">Services</a></li>
                <li><a href="/about" class="nav-link">About</a></li>
                <li><a href="/contact" class="nav-link">Contact</a></li>
                <li><a href="/quote" class="nav-link active">Get Quote</a></li>
            </ul>
        </nav>
    </header>

    <main class="quote-page">
        <div class="container">
            <section class="quote-hero">
                <h1>Get Your Free Quote</h1>
                <p>Tell us about your project and we'll provide a detailed estimate</p>
            </section>

            <form class="quote-form" method="POST" action="/quote">
                <div class="form-section">
                    <h2>Contact Information</h2>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="firstName">First Name *</label>
                            <input type="text" id="firstName" name="firstName" required>
                        </div>
                        <div class="form-group">
                            <label for="lastName">Last Name *</label>
                            <input type="text" id="lastName" name="lastName" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="email">Email *</label>
                            <input type="email" id="email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="phone">Phone *</label>
                            <input type="tel" id="phone" name="phone" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="address">Project Address</label>
                        <input type="text" id="address" name="address" placeholder="Street address, City, State, ZIP">
                    </div>
                </div>

                <div class="form-section">
                    <h2>Project Details</h2>
                    <div class="form-group">
                        <label for="serviceType">Service Type *</label>
                        <select id="serviceType" name="serviceType" required>
                            <option value="">Select a service</option>
                            ${this.generateServiceOptions(template)}
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="timeline">Preferred Timeline</label>
                        <select id="timeline" name="timeline">
                            <option value="">Select timeline</option>
                            <option value="asap">As soon as possible</option>
                            <option value="1-2weeks">1-2 weeks</option>
                            <option value="1month">Within 1 month</option>
                            <option value="2-3months">2-3 months</option>
                            <option value="flexible">Flexible</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="budget">Estimated Budget</label>
                        <select id="budget" name="budget">
                            <option value="">Select budget range</option>
                            <option value="under-5k">Under $5,000</option>
                            <option value="5k-10k">$5,000 - $10,000</option>
                            <option value="10k-25k">$10,000 - $25,000</option>
                            <option value="25k-50k">$25,000 - $50,000</option>
                            <option value="over-50k">Over $50,000</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="description">Project Description *</label>
                        <textarea id="description" name="description" rows="4" required
                                  placeholder="Please describe your project in detail..."></textarea>
                    </div>
                </div>

                <div class="form-section">
                    <h2>Additional Information</h2>
                    <div class="form-group">
                        <label for="additionalInfo">Special Requirements or Questions</label>
                        <textarea id="additionalInfo" name="additionalInfo" rows="3"
                                  placeholder="Any special requirements, accessibility needs, or questions..."></textarea>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Submit Quote Request</button>
                    <p class="form-note">* Required fields. We'll respond within 24 hours with your detailed quote.</p>
                </div>
            </form>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-bottom">
                <p>&copy; \${new Date().getFullYear()} \${SITE_CONFIG.businessName}. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script src="/public/js/main.js"></script>
</body>
</html>\`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

async function handleQuoteSubmission(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const quoteData = {
      firstName: formData.get('firstName')?.toString() || '',
      lastName: formData.get('lastName')?.toString() || '',
      email: formData.get('email')?.toString() || '',
      phone: formData.get('phone')?.toString() || '',
      address: formData.get('address')?.toString() || '',
      serviceType: formData.get('serviceType')?.toString() || '',
      timeline: formData.get('timeline')?.toString() || '',
      budget: formData.get('budget')?.toString() || '',
      description: formData.get('description')?.toString() || '',
      additionalInfo: formData.get('additionalInfo')?.toString() || '',
      timestamp: new Date().toISOString(),
      site: SITE_CONFIG.siteName
    };

    // Basic validation
    if (!quoteData.firstName || !quoteData.lastName || !quoteData.email || !quoteData.phone || !quoteData.description) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Here you would typically:
    // 1. Save to database
    // 2. Send email notification
    // 3. Log the submission

    console.log('Quote request submission:', quoteData);

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Thank you for your quote request. We will contact you within 24 hours with a detailed estimate.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Quote form error:', error);
    return new Response('Error processing quote request', { status: 500 });
  }
}`;
  }

  private generateServiceOptions(template: IndustryTemplate): string {
    const optionsByIndustry: Record<string, string[]> = {
      'construction-roofing': [
        'Residential Roofing',
        'Commercial Roofing',
        'Roof Repair',
        'Emergency Repair',
        'Roof Inspection',
        'Gutter Services',
        'Storm Damage Repair'
      ],
      'logistics-moving': [
        'Residential Moving',
        'Commercial Moving',
        'Packing Services',
        'Storage Solutions',
        'Long Distance Moving',
        'Specialty Items'
      ]
    };

    const options = optionsByIndustry[this.config.industry] || ['General Service'];
    return options.map(option => `<option value="${option.toLowerCase().replace(/\s+/g, '-')}">${option}</option>`).join('\n                            ');
  }

  private generateAppointmentHandler(template: IndustryTemplate): string {
    return `/**
 * Appointment Booking Handler for ${this.config.businessName}
 * Industry: ${template.name}
 */

import { SITE_CONFIG } from "../site-config.ts";

export async function appointmentHandler(request: Request): Promise<Response> {
  if (request.method === 'POST') {
    return await handleAppointmentSubmission(request);
  }

  const html = \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Book Appointment - \${SITE_CONFIG.businessName}</title>
    <meta name="description" content="Schedule an appointment with \${SITE_CONFIG.businessName}">
    <link rel="stylesheet" href="/public/css/main.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <header class="header">
        <nav class="nav container">
            <div class="nav-brand">
                <h1>\${SITE_CONFIG.businessName}</h1>
            </div>
            <ul class="nav-menu">
                <li><a href="/" class="nav-link">Home</a></li>
                <li><a href="/services" class="nav-link">Services</a></li>
                <li><a href="/about" class="nav-link">About</a></li>
                <li><a href="/contact" class="nav-link">Contact</a></li>
                <li><a href="/appointment" class="nav-link active">Book Appointment</a></li>
            </ul>
        </nav>
    </header>

    <main class="appointment-page">
        <div class="container">
            <section class="appointment-hero">
                <h1>Book Your Appointment</h1>
                <p>Schedule a convenient time for your consultation or service</p>
            </section>

            <form class="appointment-form" method="POST" action="/appointment">
                <div class="form-section">
                    <h2>Personal Information</h2>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="firstName">First Name *</label>
                            <input type="text" id="firstName" name="firstName" required>
                        </div>
                        <div class="form-group">
                            <label for="lastName">Last Name *</label>
                            <input type="text" id="lastName" name="lastName" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="email">Email *</label>
                            <input type="email" id="email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="phone">Phone *</label>
                            <input type="tel" id="phone" name="phone" required>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h2>Appointment Details</h2>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="appointmentType">Appointment Type *</label>
                            <select id="appointmentType" name="appointmentType" required>
                                <option value="">Select appointment type</option>
                                <option value="consultation">Initial Consultation</option>
                                <option value="follow-up">Follow-up Appointment</option>
                                <option value="service">Service Appointment</option>
                                <option value="emergency">Emergency Appointment</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="preferredDate">Preferred Date *</label>
                            <input type="date" id="preferredDate" name="preferredDate" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="preferredTime">Preferred Time *</label>
                        <select id="preferredTime" name="preferredTime" required>
                            <option value="">Select time</option>
                            <option value="9:00">9:00 AM</option>
                            <option value="10:00">10:00 AM</option>
                            <option value="11:00">11:00 AM</option>
                            <option value="13:00">1:00 PM</option>
                            <option value="14:00">2:00 PM</option>
                            <option value="15:00">3:00 PM</option>
                            <option value="16:00">4:00 PM</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="reason">Reason for Appointment *</label>
                        <textarea id="reason" name="reason" rows="4" required
                                  placeholder="Please describe the reason for your appointment..."></textarea>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Book Appointment</button>
                    <p class="form-note">* Required fields. We'll confirm your appointment within 2 business hours.</p>
                </div>
            </form>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-bottom">
                <p>&copy; \${new Date().getFullYear()} \${SITE_CONFIG.businessName}. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script src="/public/js/main.js"></script>
</body>
</html>\`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

async function handleAppointmentSubmission(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const appointmentData = {
      firstName: formData.get('firstName')?.toString() || '',
      lastName: formData.get('lastName')?.toString() || '',
      email: formData.get('email')?.toString() || '',
      phone: formData.get('phone')?.toString() || '',
      appointmentType: formData.get('appointmentType')?.toString() || '',
      preferredDate: formData.get('preferredDate')?.toString() || '',
      preferredTime: formData.get('preferredTime')?.toString() || '',
      reason: formData.get('reason')?.toString() || '',
      timestamp: new Date().toISOString(),
      site: SITE_CONFIG.siteName
    };

    // Basic validation
    if (!appointmentData.firstName || !appointmentData.email || !appointmentData.reason) {
      return new Response('Missing required fields', { status: 400 });
    }

    console.log('Appointment request:', appointmentData);

    return new Response(JSON.stringify({
      success: true,
      message: 'Your appointment request has been submitted. We will confirm within 2 business hours.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Appointment form error:', error);
    return new Response('Error processing appointment request', { status: 500 });
  }
}`;
  }

  private generateConsultationHandler(template: IndustryTemplate): string {
    return `/**
 * Consultation Request Handler for ${this.config.businessName}
 * Industry: ${template.name}
 */

import { SITE_CONFIG } from "../site-config.ts";

export async function consultationHandler(request: Request): Promise<Response> {
  if (request.method === 'POST') {
    return await handleConsultationSubmission(request#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net --allow-env --allow-run

/**
 * =============================================================================
 * Deno Genesis Framework - Site Creation Utility
 * =============================================================================
 *
 * Unix Philosophy Implementation:
 * - Do one thing well: Create new sites with industry-specific templates
 * - Composable: Integrates with existing framework scripts and workflows
 * - Text-based config: Human-readable configuration files
 * - Explicit permissions: Only requests necessary system access
 *
 * This tool creates new sites following Deno Genesis patterns:
 * - Hub-and-spoke architecture with symbolic links to core
 * - Industry-specific templates and configurations
 * - Port management and service integration
 * - AI-friendly structure for future development
 *
 * @author Pedro M. Dominguez - Dominguez Tech Solutions LLC
 * @version 2.0.0
 * @license AGPL-3.0
 */

import { parseArgs } from "https://deno.land/std@0.200.0/cli/parse_args.ts";
import { colors } from "https://deno.land/std@0.200.0/fmt/colors.ts";
import { ensureDir } from "https://deno.land/std@0.200.0/fs/ensure_dir.ts";
import { exists } from "https://deno.land/std@0.200.0/fs/exists.ts";

// =============================================================================
// TYPE DEFINITIONS - INDUSTRY-SPECIFIC CONFIGURATION
// =============================================================================

interface IndustryTemplate {
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  businessType: string;
  defaultFeatures: string[];
  sampleContent: {
    heroTitle: string;
    heroSubtitle: string;
    aboutSection: string;
    servicesTitle: string;
    ctaText: string;
  };
  requiredPages: string[];
  systemdDescription: string;
  nginxConfig?: {
    uploadLimit?: string;
    rateLimit?: string;
    specialLocations?: string[];
  };
}

interface SiteConfiguration {
  siteName: string;
  businessName: string;
  domain: string;
  port: number;
  industry: string;
  template: IndustryTemplate;
  features: string[];
  author: string;
  email: string;
  phone?: string;
  address?: string;
}

interface CreationResult {
  success: boolean;
  siteName: string;
  siteDirectory: string;
  port: number;
  steps: CreationStep[];
  errors: string[];
  warnings: string[];
  nextSteps: string[];
}

interface CreationStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  message?: string;
  duration?: number;
}

// =============================================================================
// INDUSTRY TEMPLATES - BASED ON REAL DEPLOYMENTS
// =============================================================================

const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  'construction-roofing': {
    name: 'Construction & Roofing',
    description: 'Professional contracting and roofing services',
    primaryColor: '#1e40af', // Trust-building blue
    accentColor: '#dc2626',  // Urgent red for CTAs
    backgroundColor: '#f8fafc',
    businessType: 'Service Business',
    defaultFeatures: [
      'quote-request-form',
      'photo-gallery',
      'weather-integration',
      'emergency-contact',
      'testimonials',
      'service-areas',
      'insurance-credentials'
    ],
    sampleContent: {
      heroTitle: 'Professional Roofing Services',
      heroSubtitle: 'Quality craftsmanship and reliable service for your home or business',
      aboutSection: 'With over [X] years of experience, we provide comprehensive roofing solutions including repairs, replacements, and emergency services.',
      servicesTitle: 'Our Services',
      ctaText: 'Get Your Free Estimate'
    },
    requiredPages: ['/', '/services', '/about', '/contact', '/quote'],
    systemdDescription: 'Professional Roofing and Construction Services',
    nginxConfig: {
      uploadLimit: '25M', // For project photos
      rateLimit: '10r/s',
      specialLocations: ['/quote', '/emergency']
    }
  },

  'professional-services': {
    name: 'Professional Services',
    description: 'Legal, accounting, consulting, and business services',
    primaryColor: '#1f2937', // Professional dark gray
    accentColor: '#059669',  // Success green
    backgroundColor: '#ffffff',
    businessType: 'Professional Practice',
    defaultFeatures: [
      'appointment-booking',
      'client-portal',
      'document-upload',
      'consultation-request',
      'credentials-display',
      'case-studies',
      'privacy-policy'
    ],
    sampleContent: {
      heroTitle: 'Expert Professional Services',
      heroSubtitle: 'Trusted expertise and personalized solutions for your business needs',
      aboutSection: 'Our experienced team provides comprehensive professional services tailored to help your business succeed and grow.',
      servicesTitle: 'Our Expertise',
      ctaText: 'Schedule Consultation'
    },
    requiredPages: ['/', '/services', '/about', '/contact', '/consultation'],
    systemdDescription: 'Professional Services and Business Consulting',
    nginxConfig: {
      uploadLimit: '50M', // For legal documents
      rateLimit: '5r/s',
      specialLocations: ['/client-portal', '/upload']
    }
  },

  'developer-community': {
    name: 'Developer Community',
    description: 'Tech community, meetups, and developer resources',
    primaryColor: '#7c3aed', // Tech purple
    accentColor: '#f59e0b',  // Warning amber
    backgroundColor: '#fafafa',
    businessType: 'Community Platform',
    defaultFeatures: [
      'event-calendar',
      'member-directory',
      'job-board',
      'resource-library',
      'discussion-forum',
      'meetup-rsvp',
      'mentor-matching'
    ],
    sampleContent: {
      heroTitle: 'Oklahoma Developer Community',
      heroSubtitle: 'Connect, learn, and grow with fellow developers in Oklahoma',
      aboutSection: 'OKDevs is a thriving community of developers, designers, and tech enthusiasts working to grow the Oklahoma technology ecosystem.',
      servicesTitle: 'Community Resources',
      ctaText: 'Join the Community'
    },
    requiredPages: ['/', '/events', '/members', '/resources', '/jobs'],
    systemdDescription: 'Developer Community Platform and Resource Hub',
    nginxConfig: {
      uploadLimit: '10M',
      rateLimit: '15r/s',
      specialLocations: ['/api/events', '/api/jobs', '/api/members']
    }
  },

  'healthcare-beauty': {
    name: 'Healthcare & Beauty',
    description: 'Medical practices, clinics, salons, and wellness services',
    primaryColor: '#0f172a', // Deep trust
    accentColor: '#ef4444',  // Warm red
    backgroundColor: '#f1f5f9',
    businessType: 'Healthcare Practice',
    defaultFeatures: [
      'appointment-scheduling',
      'patient-portal',
      'service-menu',
      'before-after-gallery',
      'staff-bios',
      'hipaa-compliance',
      'insurance-accepted'
    ],
    sampleContent: {
      heroTitle: 'Premium Healthcare Services',
      heroSubtitle: 'Compassionate care and expert treatment in a comfortable environment',
      aboutSection: 'Our dedicated team provides personalized healthcare services with a focus on patient comfort and exceptional outcomes.',
      servicesTitle: 'Our Services',
      ctaText: 'Book Appointment'
    },
    requiredPages: ['/', '/services', '/about', '/contact', '/appointment'],
    systemdDescription: 'Healthcare and Wellness Services Platform',
    nginxConfig: {
      uploadLimit: '5M',
      rateLimit: '8r/s',
      specialLocations: ['/patient-portal', '/appointment']
    }
  },

  'retail-ecommerce': {
    name: 'Retail & E-commerce',
    description: 'Online stores, local retail, and product businesses',
    primaryColor: '#be123c', // Retail red
    accentColor: '#16a34a',  // Success green
    backgroundColor: '#fefefe',
    businessType: 'Retail Business',
    defaultFeatures: [
      'product-catalog',
      'shopping-cart',
      'inventory-display',
      'customer-reviews',
      'wishlist',
      'store-locator',
      'shipping-calculator'
    ],
    sampleContent: {
      heroTitle: 'Quality Products, Local Service',
      heroSubtitle: 'Discover our curated selection of premium products with personalized service',
      aboutSection: 'We pride ourselves on offering high-quality products and exceptional customer service to our community.',
      servicesTitle: 'Our Products',
      ctaText: 'Shop Now'
    },
    requiredPages: ['/', '/products', '/about', '/contact', '/cart'],
    systemdDescription: 'Retail and E-commerce Platform',
    nginxConfig: {
      uploadLimit: '20M',
      rateLimit: '20r/s',
      specialLocations: ['/api/cart', '/api/products', '/checkout']
    }
  },

  'logistics-moving': {
    name: 'Logistics & Moving',
    description: 'Moving companies, freight, and logistics services',
    primaryColor: '#1e3a8a', // Transport blue
    accentColor: '#ea580c',  // Orange for urgency
    backgroundColor: '#f9fafb',
    businessType: 'Logistics Service',
    defaultFeatures: [
      'quote-calculator',
      'booking-system',
      'tracking-portal',
      'service-areas',
      'moving-tips',
      'inventory-checklist',
      'insurance-coverage'
    ],
    sampleContent: {
      heroTitle: 'Reliable Moving Services',
      heroSubtitle: 'Professional, efficient, and stress-free moving solutions for your next relocation',
      aboutSection: 'With experienced teams and modern equipment, we make your move smooth and hassle-free.',
      servicesTitle: 'Moving Solutions',
      ctaText: 'Get Moving Quote'
    },
    requiredPages: ['/', '/services', '/about', '/contact', '/quote'],
    systemdDescription: 'Logistics and Moving Services Platform',
    nginxConfig: {
      uploadLimit: '15M',
      rateLimit: '12r/s',
      specialLocations: ['/quote', '/tracking', '/booking']
    }
  }
};

// =============================================================================
// PORT MANAGEMENT - PREVENT CONFLICTS
// =============================================================================

const RESERVED_PORTS = new Set([3000, 3001, 3002, 3003, 3004]);
const PORT_RANGE_START = 3005;
const PORT_RANGE_END = 3099;

async function getNextAvailablePort(): Promise<number> {
  const sitesDir = '../sites';

  try {
    const usedPorts = new Set<number>();

    // Add reserved ports
    RESERVED_PORTS.forEach(port => usedPorts.add(port));

    // Check existing sites for port usage
    if (await exists(sitesDir)) {
      for await (const dirEntry of Deno.readDir(sitesDir)) {
        if (dirEntry.isDirectory) {
          const siteConfigPath = `${sitesDir}/${dirEntry.name}/site-config.ts`;
          if (await exists(siteConfigPath)) {
            try {
              const content = await Deno.readTextFile(siteConfigPath);
              const portMatch = content.match(/PORT:\s*(\d+)/);
              if (portMatch) {
                usedPorts.add(parseInt(portMatch[1]));
              }
            } catch {
              // Continue if file can't be read
            }
          }
        }
      }
    }

    // Find next available port
    for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
      if (!usedPorts.has(port)) {
        return port;
      }
    }

    throw new Error(`No available ports in range ${PORT_RANGE_START}-${PORT_RANGE_END}`);
  } catch (error) {
    console.error(colors.yellow(`Warning: Could not scan existing ports: ${error.message}`));
    return PORT_RANGE_START;
  }
}

// =============================================================================
// SITE CREATION ENGINE
// =============================================================================

class SiteCreator {
  private config: SiteConfiguration;
  private result: CreationResult;

  constructor(config: SiteConfiguration) {
    this.config = config;
    this.result = {
      success: false,
      siteName: config.siteName,
      siteDirectory: `../sites/${config.siteName}`,
      port: config.port,
      steps: [],
      errors: [],
      warnings: [],
      nextSteps: []
    };
  }

  async create(): Promise<CreationResult> {
    console.log(colors.cyan(`\n🚀 Creating new Deno Genesis site: ${this.config.siteName}`));
    console.log(colors.gray(`Industry: ${this.config.template.name}`));
    console.log(colors.gray(`Port: ${this.config.port}`));

    try {
      await this.executeStep('Validate Configuration', () => this.validateConfiguration());
      await this.executeStep('Create Site Directory', () => this.createSiteDirectory());
      await this.executeStep('Create Symbolic Links', () => this.createSymbolicLinks());
      await this.executeStep('Generate Site Configuration', () => this.generateSiteConfig());
      await this.executeStep('Create Main Entry Point', () => this.createMainFile());
      await this.executeStep('Generate Route Structure', () => this.createRouteStructure());
      await this.executeStep('Create Public Assets', () => this.createPublicAssets());
      await this.executeStep('Generate Industry Templates', () => this.generateIndustryTemplates());
      await this.executeStep('Create SystemD Service', () => this.createSystemdService());
      await this.executeStep('Generate Nginx Configuration', () => this.createNginxConfig());
      await this.executeStep('Create Documentation', () => this.createDocumentation());

      this.result.success = true;
      this.generateNextSteps();

    } catch (error) {
      this.result.errors.push(`Site creation failed: ${error.message}`);
      this.result.success = false;
    }

    return this.result;
  }

  private async executeStep(stepName: string, operation: () => Promise<void>): Promise<void> {
    const step: CreationStep = {
      name: stepName,
      status: 'running'
    };

    this.result.steps.push(step);
    console.log(colors.blue(`  → ${stepName}...`));

    const startTime = Date.now();

    try {
      await operation();
      step.status = 'completed';
      step.duration = Date.now() - startTime;
      console.log(colors.green(`    ✓ ${stepName} completed (${step.duration}ms)`));
    } catch (error) {
      step.status = 'failed';
      step.message = error.message;
      step.duration = Date.now() - startTime;
      console.log(colors.red(`    ✗ ${stepName} failed: ${error.message}`));
      throw error;
    }
  }

  private async validateConfiguration(): Promise<void> {
    // Check if site already exists
    if (await exists(this.result.siteDirectory)) {
      throw new Error(`Site directory already exists: ${this.result.siteDirectory}`);
    }

    // Validate port availability
    const usedPorts = new Set<number>();
    const sitesDir = '../sites';

    if (await exists(sitesDir)) {
      for await (const dirEntry of Deno.readDir(sitesDir)) {
        if (dirEntry.isDirectory) {
          const siteConfigPath = `${sitesDir}/${dirEntry.name}/site-config.ts`;
          if (await exists(siteConfigPath)) {
            try {
              const content = await Deno.readTextFile(siteConfigPath);
              const portMatch = content.match(/PORT:\s*(\d+)/);
              if (portMatch) {
                usedPorts.add(parseInt(portMatch[1]));
              }
            } catch {
              // Continue if file can't be read
            }
          }
        }
      }
    }

    if (usedPorts.has(this.config.port)) {
      throw new Error(`Port ${this.config.port} is already in use`);
    }

    // Validate site name format
    if (!/^[a-z0-9-]+$/.test(this.config.siteName)) {
      throw new Error('Site name must contain only lowercase letters, numbers, and hyphens');
    }

    // Validate domain format
    if (this.config.domain && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(this.config.domain)) {
      throw new Error('Invalid domain format');
    }
  }

  private async createSiteDirectory(): Promise<void> {
    await ensureDir(this.result.siteDirectory);

    const requiredDirs = [
      'routes',
      'public',
      'public/css',
      'public/js',
      'public/images',
      'components',
      'types',
      'services'
    ];

    for (const dir of requiredDirs) {
      await ensureDir(`${this.result.siteDirectory}/${dir}`);
    }
  }

  private async createSymbolicLinks(): Promise<void> {
    const coreModules = [
      'middleware',
      'database',
      'config',
      'utils',
      'meta'
    ];

    for (const module of coreModules) {
      const sourcePath = `../../core/${module}`;
      const targetPath = `${this.result.siteDirectory}/${module}`;

      try {
        await Deno.symlink(sourcePath, targetPath);
      } catch (error) {
        if (error instanceof Deno.errors.AlreadyExists) {
          await Deno.remove(targetPath);
          await Deno.symlink(sourcePath, targetPath);
        } else {
          throw error;
        }
      }
    }
  }

  private async generateSiteConfig(): Promise<void> {
    const template = this.config.template;

    const siteConfig = `/**
 * =============================================================================
 * ${this.config.businessName} - Site Configuration
 * =============================================================================
 *
 * Industry: ${template.name}
 * Created: ${new Date().toISOString().split('T')[0]}
 * Author: ${this.config.author}
 * Framework: Deno Genesis v2.0.0
 *
 * This configuration follows Deno Genesis patterns for industry-specific
 * customization while maintaining framework consistency.
 */

export const SITE_CONFIG = {
  // Basic site information
  siteName: '${this.config.siteName}',
  businessName: '${this.config.businessName}',
  domain: '${this.config.domain}',

  // Server configuration
  PORT: ${this.config.port},
  HOST: 'localhost',

  // Industry configuration
  industry: '${this.config.industry}',
  businessType: '${template.businessType}',

  // Branding and design
  theme: {
    primaryColor: '${template.primaryColor}',
    accentColor: '${template.accentColor}',
    backgroundColor: '${template.backgroundColor}',
    fontFamily: 'Inter, system-ui, sans-serif'
  },

  // Feature flags
  features: {
${template.defaultFeatures.map(feature => `    ${feature.replace(/-/g, '_')}: true`).join(',\n')}
  },

  // Contact information
  contact: {
    email: '${this.config.email}',
    phone: '${this.config.phone || ''}',
    address: '${this.config.address || ''}'
  },

  // SEO configuration
  seo: {
    title: '${this.config.businessName}',
    description: '${template.sampleContent.heroSubtitle}',
    keywords: ['${this.config.industry}', 'professional services', 'local business'],
    author: '${this.config.author}'
  },

  // Performance settings
  performance: {
    cacheStaticAssets: true,
    enableCompression: true,
    enableServiceWorker: false
  },

  // Security settings
  security: {
    enableCSRF: true,
    enableCORS: false,
    allowedOrigins: ['https://${this.config.domain}']
  }
} as const;

export type SiteConfig = typeof SITE_CONFIG;
`;

    await Deno.writeTextFile(`${this.result.siteDirectory}/site-config.ts`, siteConfig);
  }

  private async createMainFile(): Promise<void> {
    const mainContent = `#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env

/**
 * =============================================================================
 * ${this.config.businessName} - Main Application Entry Point
 * =============================================================================
 *
 * This is the main entry point for the ${this.config.businessName} website,
 * built with the Deno Genesis framework following Unix Philosophy principles.
 *
 * Security Model:
 * --allow-net:   Required for HTTP server and external API calls
 * --allow-read:  Required for static assets and configuration files
 * --allow-write: Required for logging and temporary files
 * --allow-env:   Required for environment variable access
 *
 * @author ${this.config.author}
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.200.0/http/server.ts";
import { SITE_CONFIG } from "./site-config.ts";
import { createRouter } from "./routes/router.ts";
import { Logger } from "./utils/logger.ts";
import { corsMiddleware } from "./middleware/cors.ts";
import { securityMiddleware } from "./middleware/security.ts";
import { loggingMiddleware } from "./middleware/logging.ts";

// Initialize logger for this site
const logger = new Logger('${this.config.siteName}');

/**
 * Main application handler following Unix Philosophy:
 * - Single responsibility: Handle HTTP requests for this site
 * - Composable: Uses middleware pipeline for cross-cutting concerns
 * - Explicit: Clear error handling and logging
 */
async function handleRequest(request: Request): Promise<Response> {
  try {
    // Apply middleware pipeline
    const middlewareStack = [
      corsMiddleware,
      securityMiddleware,
      loggingMiddleware
    ];

    // Create router for this site
    const router = createRouter();

    // Process request through middleware and router
    let response = await router.handle(request);

    // Apply response middleware
    for (const middleware of middlewareStack.reverse()) {
      if (middleware.processResponse) {
        response = await middleware.processResponse(response, request);
      }
    }

    return response;

  } catch (error) {
    logger.error('Request handling failed', { error: error.message, url: request.url });

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Start the ${this.config.businessName} application server
 */
async function startServer(): Promise<void> {
  const { PORT, HOST } = SITE_CONFIG;

  logger.info(\`Starting \${SITE_CONFIG.businessName} server\`, {
    port: PORT,
    host: HOST,
    industry: SITE_CONFIG.industry,
    features: Object.keys(SITE_CONFIG.features).filter(key => SITE_CONFIG.features[key as keyof typeof SITE_CONFIG.features])
  });

  try {
    await serve(handleRequest, {
      port: PORT,
      hostname: HOST,
      onListen: ({ port, hostname }) => {
        logger.info(\`🚀 \${SITE_CONFIG.businessName} server running\`, {
          url: \`http://\${hostname}:\${port}\`,
          environment: Deno.env.get('DENO_ENV') || 'development'
        });
      }
    });
  } catch (error) {
    logger.error('Server startup failed', { error: error.message });
    Deno.exit(1);
  }
}

// Handle graceful shutdown
Deno.addSignalListener('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  Deno.exit(0);
});

Deno.addSignalListener('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  Deno.exit(0);
});

// Start the server if this file is run directly
if (import.meta.main) {
  await startServer();
}

export { handleRequest, startServer };
`;

    await Deno.writeTextFile(`${this.result.siteDirectory}/main.ts`, mainContent);
  }

  private async createRouteStructure(): Promise<void> {
    const template = this.config.template;

    // Create router configuration
    const routerContent = `/**
 * Router Configuration for ${this.config.businessName}
 *
 * Industry-specific routing following Deno Genesis patterns.
 * Each route handler follows Unix Philosophy: single responsibility,
 * composable functionality, explicit error handling.
 */

import { Router } from "../utils/router.ts";
import { SITE_CONFIG } from "../site-config.ts";

// Import route handlers
import { homeHandler } from "./home.ts";
import { aboutHandler } from "./about.ts";
import { servicesHandler } from "./services.ts";
import { contactHandler } from "./contact.ts";
${template.requiredPages.includes('/quote') ? 'import { quoteHandler } from "./quote.ts";' : ''}
${template.requiredPages.includes('/appointment') ? 'import { appointmentHandler } from "./appointment.ts";' : ''}
${template.requiredPages.includes('/consultation') ? 'import { consultationHandler } from "./consultation.ts";' : ''}

export function createRouter(): Router {
  const router = new Router();

  // Static asset handling
  router.addRoute('GET', '/public/*', async (request) => {
    const url = new URL(request.url);
    const filePath = \`.\${url.pathname}\`;

    try {
      const file = await Deno.readFile(filePath);
      const ext = filePath.split('.').pop()?.toLowerCase();

      const mimeTypes: Record<string, string> = {
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon'
      };

      return new Response(file, {
        headers: {
          'Content-Type': mimeTypes[ext || ''] || 'application/octet-stream',
          'Cache-Control': 'public, max-age=31536000'
        }
      });

    } catch {
      return new Response('File not found', { status: 404 });
    }
  });

  // Main site routes
  router.addRoute('GET', '/', homeHandler);
  router.addRoute('GET', '/about', aboutHandler);
  router.addRoute('GET', '/services', servicesHandler);
  router.addRoute('GET', '/contact', contactHandler);
  router.addRoute('POST', '/contact', contactHandler);

  ${template.requiredPages.includes('/quote') ? `
  // Quote request routes (for construction/contracting)
  router.addRoute('GET', '/quote', quoteHandler);
  router.addRoute('POST', '/quote', quoteHandler);` : ''}

  ${template.requiredPages.includes('/appointment') ? `
  // Appointment booking routes (for healthcare/services)
  router.addRoute('GET', '/appointment', appointmentHandler);
  router.addRoute('POST', '/appointment', appointmentHandler);` : ''}

  ${template.requiredPages.includes('/consultation') ? `
  // Consultation request routes (for professional services)
  router.addRoute('GET', '/consultation', consultationHandler);
  router.addRoute('POST', '/consultation', consultationHandler);` : ''}

  // Health check endpoint
  router.addRoute('GET', '/health', async () => {
    return new Response(JSON.stringify({
      status: 'healthy',
      site: SITE_CONFIG.siteName,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  });

  // 404 handler
  router.setNotFoundHandler(() => {
    return new Response('Page not found', { status: 404 });
  });

  return router;
}
`;

    await Deno.writeTextFile(`${this.result.siteDirectory}/routes/router.ts`, routerContent);

    // Create individual route handlers
    await this.createRouteHandler('home', template);
    await this.createRouteHandler('about', template);
    await this.createRouteHandler('services', template);
    await this.createRouteHandler('contact', template);

    if (template.requiredPages.includes('/quote')) {
      await this.createRouteHandler('quote', template);
    }
    if (template.requiredPages.includes('/appointment')) {
      await this.createRouteHandler('appointment', template);
    }
    if (template.requiredPages.includes('/consultation')) {
      await this.createRouteHandler('consultation', template);
    }
  }
