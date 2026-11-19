/**
 * Interface Segregation Principle (ISP) Port: EmailSender
 * Decouples outbox and notification dispatch from transactional mail vendors (SMTP / Sendgrid / Console).
 */
export interface EmailSender {
  send(to: string, subject: string, body: string): Promise<boolean>;
}
