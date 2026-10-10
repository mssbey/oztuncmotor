import "dotenv/config";

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.APP_SECRET = "test-secret-test-secret-test-secret-123456";
delete process.env.SMTP_HOST;
