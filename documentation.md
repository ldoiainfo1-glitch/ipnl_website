India Property Network Ltd. - Complete
Module Documentation
Purpose: Detailed module-wise backend documentation for India Property Network Ltd.
Module 1 – Authentication & User Management
Features:
• User Registration
• Login / Logout
• JWT Authentication
• Role Based Access Control
User Roles:
• Developer
• Broker / Channel Partner
• Family Office
• HNI
• NBFC / Fund / REIT
• Land Aggregator
• Admin
Fields:
Company Name, PAN, GST, RERA Number, Email, Mobile Number, Password
Statuses:
Pending Verification, Approved, Rejected, Suspended

Module 2 – KYC & RERA Verification Engine
Features:
• PAN Verification
• GST Verification
• RERA Verification
• Company Verification
• Compliance Review
Workflow:
Submitted → Under Review → Approved → Veriϐied Badge
Storage:
KYC documents stored securely in AWS S3.

Module 3 – Company & Member Profiles
Features:
• Firm Profile
• Team Members
• Company Description
• Asset Preferences
• Verification Badge
• Reputation Score
Searchable by:
City, Asset Class, Ticket Size, User Type

Module 4 – Opportunities Marketplace
Features:
• Create Mandates
• Browse Mandates
• Advanced Filters
• Public & Private Listings
Mandate Fields:
Title
Asset Class
Ticket Size
Location
RERA Number
Description
Supporting Documents
Categories:
Residential
Commercial
Land
Hospitality
Warehousing
Structured Debt
Distressed Assets

Module 5 – Intro Request System
Workflow:
Mandate → Intro Request → Accept / Reject → Open Communication
Features:
• Request Introduction
• Accept / Reject
• Status Tracking
• Audit Logs
Statuses:
Pending
Accepted
Rejected
Expired

Module 6 – NDA Vault
Features:
• NDA Generation
• Digital Signatures
• Secure Document Sharing
• Version History
• Watermarking
• Access Logs
Documents:
Financial Reports
Title Reports
Project Documents
Legal Agreements

Module 7 – Messaging System
Features:
• Real-time Chat
• Mandate-linked Conversations
• File Sharing
• Message History
Technology:
Socket.IO / WebSockets
Tables:
Conversations
Messages

Module 8 – Notification Center
Notification Types:
• Intro Requests
• Intro Accepted
• Intro Rejected
• NDA Signed
• Document Uploads
• Deal Alerts
Channels:
In-App
Email
Push Notifications
WhatsApp

Module 9 – Reputation & Trust Engine
Score Based On:
• Verification Status
• Accepted Intros
• Successful Deals
• NDA Compliance
• Reports Against User
Output:
Trust Score
Verified Badge
Leaderboard Position

Module 10 – Analytics & Insights
Metrics:
• Profile Views
• Mandate Views
• Intro Requests
• Acceptance Rates
• NDA Signatures
Purpose:
Measure buying signals and engagement.

Module 11 – Deal Alert Engine
Features:
• Saved Searches
• Instant Alerts
• Email Alerts
• Push Alerts
Example:
Commercial Property
Mumbai
50–200 Cr
Notify immediately when matching mandate is posted.

Module 12 – Search & Discovery Engine
Powered By:
Elasticsearch / OpenSearch
Filters:
Location
Asset Type
Ticket Size
RERA Status
User Category

Module 13 – Admin Console
Features:
• KYC Review
• RERA Verification
• User Management
• Mandate Moderation
• Compliance Reports
• System Monitoring
Admin Actions:
Approve
Reject
Suspend
Flag

Module 14 – Audit Trail & Compliance
Tracks:
• Profile Changes
• Intro Requests
• NDA Activities
• Document Access
• Downloads
• User Actions
Purpose:
Regulatory Compliance and Attribution Protection

Module 15 – Document Management System
Features:
• Upload Documents
• Version Control
• Watermark PDFs
• Secure Downloads
• Access Permissions
Storage:
AWS S3

Module 16 – Enterprise Features
Enterprise Account
• Multi-seat Access
• Team Management
• SSO Login
• Team Analytics
• Dedicated Relationship Manager

Module 17 – Mobile App Services
Future Roadmap:
• Android App
• iOS App
• Offline Cache
• Biometric Login
• Push Notifications

Module 18 – WhatsApp Business Integration
Features:
• Intro Notifications
• NDA Reminders
• Deal Alerts
• Verification Updates
Opt-in only communication.

Module 19 – AI Matching Engine (Future)
Features:
• Smart Buyer Matching
• Investor Recommendations
• Opportunity Suggestions
• Lead Scoring
Based on:
User Behaviour
Past Transactions
Asset Preferences

Module 20 – System Infrastructure
Backend:
NestJS + Node.js
Database:
PostgreSQL
Cache:
Redis
Queue:
BullMQ
Storage:
AWS S3
Search:
OpenSearch
Deployment:
AWS ECS / Kubernetes
Monitoring:
CloudWatch
Grafana
Prometheus
