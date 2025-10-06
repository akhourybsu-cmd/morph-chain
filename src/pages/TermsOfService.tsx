export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
      
      <div className="space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Morph Chain ("the Service"), you accept and agree to be bound by the terms and 
            provision of this agreement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">2. Proprietary Rights</h2>
          <p>
            All puzzles, word lists, algorithms, game mechanics, and related intellectual property are the exclusive 
            property of Morph Chain and are protected by copyright, trademark, and other intellectual property laws.
          </p>
          <p className="mt-2">
            Users are explicitly prohibited from:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Scraping, extracting, or downloading puzzle data in bulk</li>
            <li>Reverse-engineering game algorithms or mechanics</li>
            <li>Redistributing, selling, or commercially exploiting any game content</li>
            <li>Creating derivative works based on Morph Chain puzzles or algorithms</li>
            <li>Using automated tools to access or interact with the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">3. Use License</h2>
          <p>
            Morph Chain grants you a limited, non-exclusive, non-transferable, revocable license to access and use 
            the Service for personal, non-commercial purposes only.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">4. User Conduct</h2>
          <p>
            You agree not to:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Attempt to gain unauthorized access to any portion of the Service</li>
            <li>Use the Service in any manner that could damage, disable, or impair it</li>
            <li>Attempt to probe, scan, or test the vulnerability of the Service</li>
            <li>Circumvent any security or authentication measures</li>
            <li>Use any robot, spider, scraper, or other automated means to access the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">5. Copyright Protection</h2>
          <p>
            © {new Date().getFullYear()} Morph Chain. All rights reserved.
          </p>
          <p className="mt-2">
            This Service and all of its content are protected under U.S. and international copyright laws. 
            Unauthorized reproduction, distribution, or commercial use is strictly prohibited and may result in 
            severe civil and criminal penalties.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">6. DMCA Compliance</h2>
          <p>
            Morph Chain respects intellectual property rights and expects users to do the same. We will respond 
            to clear notices of alleged copyright infringement in accordance with the Digital Millennium Copyright Act (DMCA).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">7. Monitoring and Enforcement</h2>
          <p>
            Morph Chain reserves the right to monitor user activity for security purposes and to enforce these Terms. 
            We employ rate limiting, access logging, and anomaly detection to protect our proprietary content.
          </p>
          <p className="mt-2">
            Violation of these Terms may result in:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Immediate account termination</li>
            <li>Permanent ban from the Service</li>
            <li>Legal action for damages</li>
            <li>Reporting to relevant authorities</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">8. Disclaimer of Warranties</h2>
          <p>
            The Service is provided "as is" without warranties of any kind, either express or implied.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">9. Limitation of Liability</h2>
          <p>
            In no event shall Morph Chain be liable for any indirect, incidental, special, consequential, or 
            punitive damages arising out of or related to your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">10. Changes to Terms</h2>
          <p>
            Morph Chain reserves the right to modify these Terms at any time. Continued use of the Service 
            constitutes acceptance of modified Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-3">11. Contact Information</h2>
          <p>
            For questions about these Terms or to report violations, please contact us through the app.
          </p>
        </section>

        <div className="border-t pt-6 mt-8 text-sm">
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
