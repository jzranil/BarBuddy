// ---------------------------------------------------------------------------
// HELP CENTER CONTENT
//
// Structured content for the BarBuddy Help Center, reused across all three
// portals (reviewee / lawyer / superadmin) via a single shared renderer —
// see components/common/help-center/HelpCenterContent.jsx.
//
// Each category and article carries a `roles` array so role-specific
// guidance (e.g. the Lawyer / Superadmin sections) only appears to the
// audience it's written for. An article without its own `roles` inherits
// its category's.
//
// `content` is a list of simple content blocks (paragraph / list / table)
// rather than JSX, so this stays a plain data file — see ContentBlocks.jsx
// for how each block type renders.
// ---------------------------------------------------------------------------

export const ALL_ROLES = ['reviewee', 'lawyer', 'superadmin'];

export const HELP_CATEGORIES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'rocket_launch',
    roles: ALL_ROLES,
    articles: [
      {
        id: 'what-is-barbuddy',
        question: 'What is BarBuddy?',
        content: [
          { type: 'p', text: 'BarBuddy is a subscription-based learning and review management platform designed to support Philippine Bar Examination candidates throughout their review journey.' },
          { type: 'p', text: 'The platform provides tools for practicing Bar Examination essay questions, reviewing answer feedback, monitoring competency, tracking progress, maintaining study consistency, and recognizing review milestones through achievements and badges.' },
          { type: 'p', text: 'BarBuddy is intended to serve as a supplementary review and learning platform. It does not replace official Bar Examination materials, legal authorities, professional legal advice, or the official policies and announcements of the Supreme Court of the Philippines.' },
        ],
      },
      {
        id: 'how-to-get-started',
        question: 'How do I get started?',
        content: [
          { type: 'p', text: 'After creating your BarBuddy account:' },
          {
            type: 'ol',
            items: [
              'Complete your registration and profile information.',
              'Select an available subscription package.',
              'Access your Reviewee Dashboard.',
              'Complete your assigned review activities.',
              'Answer available Bar Examination essay questions.',
              'Review your evaluation and feedback.',
              'Monitor your competency and progress.',
              'Continue practicing and reviewing to improve your performance.',
              'Earn achievements and badges as you reach milestones.',
            ],
          },
        ],
        roles: ['reviewee'],
      },
      {
        id: 'what-can-i-do',
        question: 'What can I do in BarBuddy?',
        content: [
          { type: 'p', text: "Depending on your role and available access, BarBuddy provides features for:" },
          { type: 'h5', text: 'Reviewees' },
          {
            type: 'ul',
            items: [
              'Answering Bar Examination essay questions',
              'Reviewing answer evaluations and feedback',
              'Monitoring competency by subject',
              'Tracking review progress',
              'Maintaining study streaks',
              'Earning achievements and badges',
              'Viewing assessments and performance',
              'Managing subscriptions and payment history',
              'Managing account and security settings',
            ],
          },
          { type: 'h5', text: 'Lawyers / Answer Verifiers' },
          {
            type: 'ul',
            items: [
              'Reviewing submitted reviewee answers',
              'Verifying essay evaluations',
              'Providing professional evaluation and feedback',
              'Monitoring assigned verification tasks',
            ],
          },
          { type: 'h5', text: 'Superadmins' },
          {
            type: 'ul',
            items: [
              'Managing user accounts',
              'Managing subscriptions',
              'Monitoring payment records',
              'Managing review content',
              'Monitoring verification activities',
              'Viewing system and audit logs',
              'Managing system-level settings',
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'daily-questions',
    title: 'Daily Questions',
    icon: 'quiz',
    roles: ['reviewee'],
    articles: [
      {
        id: 'what-are-daily-questions',
        question: 'What are Daily Questions?',
        content: [
          { type: 'p', text: "Daily Questions are BarBuddy's regular practice activities designed to help reviewees consistently prepare for the Philippine Bar Examination." },
          { type: 'p', text: 'Questions may cover different Bar Examination subjects and are intended to help reviewees practice:' },
          {
            type: 'ul',
            items: [
              'Identifying legal issues',
              'Recalling applicable laws and doctrines',
              'Applying legal principles to facts',
              'Constructing clear legal answers',
              'Improving legal reasoning and communication',
            ],
          },
        ],
      },
      {
        id: 'how-to-answer-daily-question',
        question: 'How do I answer a Daily Question?',
        content: [
          {
            type: 'ol',
            items: [
              'Open Daily Questions from your Reviewee Portal.',
              'Select the available question.',
              'Read the facts and question carefully.',
              'Click Start Answer when you are ready to begin.',
              'Compose your answer.',
              'Review your response before submitting.',
              'Submit your answer for evaluation.',
            ],
          },
          { type: 'p', text: 'If the question has an assigned time limit, the timer will begin when you start the answer.' },
          { type: 'h5', text: 'Why is there a Start Answer button?' },
          { type: 'p', text: 'The Start Answer button establishes the beginning of your answering session.' },
        ],
      },
    ],
  },

  {
    id: 'answer-evaluation',
    title: 'Answer Evaluation',
    icon: 'fact_check',
    roles: ['reviewee', 'lawyer'],
    articles: [
      {
        id: 'how-are-answers-evaluated',
        question: 'How are my answers evaluated?',
        content: [
          { type: 'p', text: 'BarBuddy uses structured evaluation to assess the quality of submitted essay answers.' },
          { type: 'p', text: 'The evaluation process considers the legal correctness, supporting legal basis, application of law to facts, and overall quality of the response.' },
          { type: 'p', text: 'Depending on the applicable workflow, answers may receive AI-assisted feedback and/or lawyer-verified evaluation.' },
        ],
      },
      {
        id: 'alac-framework',
        question: 'What is the ALAC Answering Framework?',
        content: [
          { type: 'p', text: 'BarBuddy uses the ALAC framework as a structured approach for evaluating and improving legal essay answers. ALAC stands for:' },
          { type: 'h5', text: 'A — Answer' },
          { type: 'p', text: 'The response should establish a clear, definitive, and correct legal conclusion, preferably at the beginning of the answer.' },
          { type: 'h5', text: 'L — Legal Basis' },
          { type: 'p', text: 'The response should identify and cite the relevant legal authorities, such as:' },
          { type: 'ul', items: ['Codal provisions', 'Statutory laws', 'Legal doctrines', 'Relevant jurisprudence'] },
          { type: 'p', text: 'The accuracy and relevance of the cited legal basis are considered in the evaluation.' },
          { type: 'h5', text: 'A — Application' },
          { type: 'p', text: 'The response should effectively connect the facts presented in the question to the applicable legal rules, doctrines, or principles. A strong application demonstrates how the law applies to the specific facts rather than merely stating a legal rule.' },
          { type: 'h5', text: 'C — Conclusion' },
          { type: 'p', text: 'The response should provide a logical and concise conclusion that summarizes the legal analysis and reinforces the answer established at the beginning.' },
        ],
      },
      {
        id: 'good-alac-answer',
        question: 'What does a good ALAC answer look like?',
        content: [
          { type: 'p', text: 'A strong answer generally follows this structure:' },
          {
            type: 'ul',
            items: [
              'Answer — State the legal conclusion directly.',
              'Legal Basis — Identify the applicable law, rule, doctrine, or jurisprudence.',
              'Application — Explain how the legal rule applies to the facts.',
              'Conclusion — State the final conclusion based on the analysis.',
            ],
          },
          { type: 'p', text: 'ALAC is a framework for organizing and evaluating legal answers. It does not require every answer to follow an identical wording or format.' },
        ],
      },
    ],
  },

  {
    id: 'five-point-grading',
    title: 'Five-Point Qualitative Grading',
    icon: 'grade',
    roles: ['reviewee', 'lawyer'],
    articles: [
      {
        id: 'how-scoring-works',
        question: 'How does BarBuddy score essay answers?',
        content: [
          { type: 'p', text: 'For applicable verified essay evaluations, BarBuddy uses a five-point qualitative grading scale ranging from 0.0 to 5.0.' },
          { type: 'p', text: 'The scale evaluates the correctness of the legal conclusion, correctness of legal bases, legal reasoning, communication, and overall presentation.' },
          {
            type: 'table',
            headers: ['Score', 'Standard'],
            rows: [
              ['5.0 — Excellent', 'Correct legal conclusion, correct legal bases, clear and complete legal reasoning, polished presentation, minimal grammatical errors.'],
              ['4.0 — Good', 'Correct legal conclusion and correct legal bases, but contains flaws in grammar, presentation, or communication.'],
              ['3.0 — Satisfactory', 'Correct legal conclusion, but cites incorrect legal bases, or mixes correct legal bases with incorrect/inapplicable ones.'],
              ['2.0 — Needs Improvement', 'Incorrect legal conclusion, but demonstrates some capacity for reasoning, communication, and reference to legal authorities.'],
              ['1.0 — Poor', 'Incorrect legal conclusion and limited reasoning/communication, though a bona fide attempt was made.'],
              ['0.0 — No Credit', 'No answer, a blank response, an irrelevant, incoherent, or nonsensical response.'],
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'ai-feedback',
    title: 'AI-Assisted Feedback',
    icon: 'smart_toy',
    roles: ['reviewee'],
    articles: [
      {
        id: 'what-is-ai-feedback',
        question: 'What is AI-assisted feedback?',
        content: [
          { type: 'p', text: 'BarBuddy may use artificial intelligence to provide feedback on submitted answers. AI-assisted feedback can help identify:' },
          {
            type: 'ul',
            items: [
              'Possible weaknesses in legal reasoning',
              'Missing legal concepts',
              'Issues with legal application',
              'Problems with the answer structure',
              'Potentially incorrect legal bases',
              'Areas that may require further review',
            ],
          },
          { type: 'p', text: 'AI feedback is intended to support learning and should not be treated as an official determination of Bar Examination performance.' },
        ],
      },
      {
        id: 'rely-on-ai-feedback',
        question: 'Should I rely solely on AI feedback?',
        content: [
          { type: 'p', text: 'No. AI feedback should be treated as a supplementary learning tool.' },
          { type: 'p', text: 'Reviewees should verify legal information against authoritative sources, including applicable laws, rules, jurisprudence, and official Supreme Court materials.' },
          { type: 'p', text: 'Where available, lawyer-verified evaluations provide an additional human review of submitted answers.' },
        ],
      },
    ],
  },

  {
    id: 'lawyer-verification-reviewee',
    title: 'Lawyer Verification',
    icon: 'gavel',
    roles: ['reviewee', 'lawyer'],
    articles: [
      {
        id: 'why-lawyer-verified',
        question: 'Why are answers verified by a lawyer?',
        content: [
          { type: 'p', text: 'Lawyer verification provides an additional level of professional review for submitted answers.' },
          { type: 'p', text: 'The lawyer/verifier may evaluate the response based on the applicable evaluation criteria and provide feedback that can help the reviewee understand:' },
          {
            type: 'ul',
            items: [
              'What was done correctly',
              'What legal concepts were missed',
              'Whether the cited legal basis is appropriate',
              'How the legal rule was applied',
              'How the answer can be improved',
            ],
          },
        ],
      },
      {
        id: 'is-score-official',
        question: 'Is my BarBuddy score my official Bar Examination score?',
        content: [
          { type: 'p', text: 'No. BarBuddy scores and competency results are learning and assessment indicators generated within the platform.' },
          { type: 'p', text: "They should not be interpreted as official Philippine Bar Examination scores or as a prediction of an individual's actual Bar Examination result." },
          { type: 'p', text: 'The actual Bar Examination is governed by the Supreme Court of the Philippines and its applicable rules, policies, and issuances.' },
        ],
      },
    ],
  },

  {
    id: 'competency',
    title: 'Competency & Performance',
    icon: 'insights',
    roles: ['reviewee', 'lawyer'],
    articles: [
      {
        id: 'what-is-competency',
        question: 'What is Legal Competency in BarBuddy?',
        content: [
          { type: 'p', text: "Legal competency is a performance indicator used by BarBuddy to summarize a reviewee's demonstrated performance across applicable Bar Examination subjects." },
          { type: 'p', text: 'It is intended to help reviewees identify:' },
          { type: 'ul', items: ['Stronger subjects', 'Weaker subjects', 'Areas requiring additional review', 'Changes in performance over time'] },
        ],
      },
      {
        id: 'essay-competency-calc',
        question: 'How is Essay Competency Score calculated?',
        content: [
          { type: 'p', text: 'For a verified five-point essay score, BarBuddy converts the score into a percentage using:' },
          { type: 'formula', text: 'Essay Competency Score = (Verified Five-Point Score ÷ 5) × 100' },
          { type: 'p', text: 'For example, a verified score of 4.0 would correspond to: (4 ÷ 5) × 100 = 80%. This percentage represents the converted competency score for that individual essay.' },
        ],
      },
      {
        id: 'subject-competency-calc',
        question: 'How is Subject Competency calculated?',
        content: [
          { type: 'p', text: 'The verified essay competency scores belonging to the same Bar subject are averaged.' },
          { type: 'formula', text: 'Subject Competency Score = Sum of Verified Essay Competency Scores ÷ Number of Verified Essays' },
          { type: 'p', text: "This allows BarBuddy to summarize performance within each subject based on the reviewee's verified essay results." },
        ],
      },
      {
        id: 'overall-competency-calc',
        question: 'How is Overall Legal Competency calculated?',
        content: [
          { type: 'p', text: 'BarBuddy determines overall legal competency using a weighted mean of the subject competency scores. Each subject competency score is multiplied by its corresponding examination weight, and the resulting values are combined.' },
          { type: 'formula', text: 'Overall Legal Competency = Σ (Subject Competency Score × Subject Weight)' },
          { type: 'p', text: 'This allows the competency profile to account for the relative weight assigned to each Bar Examination subject.' },
        ],
      },
      {
        id: 'subject-weights',
        question: 'What subject weights does BarBuddy use?',
        content: [
          { type: 'p', text: "For BarBuddy's competency computation, the following subject distribution is used:" },
          {
            type: 'table',
            headers: ['Bar Examination Subject', 'Weight'],
            rows: [
              ['Remedial Law, Legal Ethics and Legal Forms', '25%'],
              ['Commercial and Taxation Laws', '20%'],
              ['Civil Law', '20%'],
              ['Political and Public International Law', '15%'],
              ['Labor Law and Social Legislation', '10%'],
              ['Criminal Law', '10%'],
            ],
          },
          { type: 'p', text: "These weights are used by BarBuddy as part of its competency calculation framework. Always refer to the latest official Supreme Court issuances for the current Bar Examination structure and policies." },
        ],
      },
      {
        id: 'competency-profile',
        question: 'What does my competency profile show?',
        content: [
          { type: 'p', text: 'Your competency profile helps you understand your performance across different areas. It may display:' },
          {
            type: 'ul',
            items: ['Overall competency', 'Subject competency', 'Essay performance', 'ALAC-related indicators', 'Areas of strength', 'Areas requiring improvement', 'Personalized learning recommendations'],
          },
          { type: 'p', text: 'The purpose is to help you make informed decisions about where to focus your review efforts.' },
        ],
        roles: ['reviewee'],
      },
      {
        id: 'why-competency-changes',
        question: 'Why does my competency change?',
        content: [
          { type: 'p', text: 'Your competency may change as additional verified answers and assessment results are incorporated into your profile. A new result may:' },
          { type: 'ul', items: ['Increase your subject competency', 'Decrease your subject competency', 'Have little effect', 'Change your overall competency'] },
          { type: 'p', text: 'This depends on your previous results and the number and performance of the newly incorporated answers.' },
        ],
        roles: ['reviewee'],
      },
    ],
  },

  {
    id: 'study-streak',
    title: 'Study Streak',
    icon: 'local_fire_department',
    roles: ['reviewee'],
    articles: [
      {
        id: 'what-is-study-streak',
        question: 'What is a Study Streak?',
        content: [
          { type: 'p', text: 'A Study Streak represents consecutive days on which you complete the required BarBuddy review activity. It is designed to encourage consistency and regular review.' },
        ],
      },
      {
        id: 'maintain-streak',
        question: 'How do I maintain my Study Streak?',
        content: [{ type: 'p', text: 'Complete the required review activity within each applicable day. Regular participation helps maintain your current streak.' }],
      },
      {
        id: 'miss-a-day',
        question: 'What happens if I miss a day?',
        content: [
          { type: 'p', text: "Your streak may reset according to BarBuddy's configured streak rules." },
          { type: 'p', text: 'Check your Dashboard for your current streak and available progress information.' },
        ],
      },
    ],
  },

  {
    id: 'achievements',
    title: 'Achievements',
    icon: 'emoji_events',
    roles: ['reviewee'],
    articles: [
      {
        id: 'what-are-achievements',
        question: 'What are Achievements?',
        content: [
          { type: 'p', text: 'Achievements recognize specific accomplishments completed during your BarBuddy review journey. Examples may include:' },
          { type: 'ul', items: ['Completing your first question', 'Completing a certain number of questions', 'Maintaining a study streak', 'Reaching a competency milestone', 'Completing an assessment'] },
        ],
      },
      {
        id: 'what-is-sanctum',
        question: 'What is Achievements Sanctum?',
        content: [
          { type: 'p', text: 'Achievements Sanctum is the dedicated area where you can view your available achievements. Achievements are organized into:' },
          {
            type: 'ul',
            items: [
              'All — Shows all available achievements, including earned and locked achievements.',
              'Earned — Shows achievements you have already completed.',
              'Locked — Shows achievements whose requirements have not yet been completed.',
            ],
          },
        ],
      },
      {
        id: 'why-achievement-locked',
        question: 'Why is an Achievement locked?',
        content: [
          { type: 'p', text: 'An achievement is locked when its required condition has not yet been satisfied.' },
          { type: 'p', text: 'For achievements with measurable progress, BarBuddy may show your current progress toward the requirement, for example: 75 / 100 questions completed. This means you need to complete 25 more questions to satisfy the requirement.' },
        ],
      },
    ],
  },

  {
    id: 'badges',
    title: 'Badges',
    icon: 'military_tech',
    roles: ['reviewee'],
    articles: [
      {
        id: 'what-are-badges',
        question: 'What are Badges?',
        content: [{ type: 'p', text: 'Badges represent milestones earned throughout your BarBuddy review journey. They provide a visual representation of significant accomplishments and progress.' }],
      },
      {
        id: 'achievements-vs-badges',
        question: 'What is the difference between Achievements and Badges?',
        content: [
          { type: 'p', text: 'Achievements generally recognize specific accomplishments. Badges represent broader milestones that may be unlocked after completing particular requirements or achievements.' },
          { type: 'p', text: 'For example — Achievement: Complete your first Daily Question. Badge: First Step, unlocked after completing the required first-review milestone.' },
        ],
      },
      {
        id: 'how-to-unlock-badge',
        question: 'How do I unlock a Badge?',
        content: [
          { type: 'p', text: 'Badges begin in a locked state. When the required condition is satisfied, BarBuddy unlocks the corresponding badge. Requirements may involve:' },
          {
            type: 'ul',
            items: ['Completing questions', 'Maintaining a study streak', 'Reaching a performance milestone', 'Completing an assessment', 'Reaching a competency level', 'Completing a specific achievement'],
          },
        ],
      },
      {
        id: 'how-to-view-badges',
        question: 'How can I view my Badges?',
        content: [
          { type: 'p', text: 'Open the Achievements page and select View All under the Badges section.' },
          { type: 'p', text: 'The dedicated Badges page allows you to filter badges by All, Earned, and Locked.' },
        ],
      },
    ],
  },

  {
    id: 'assessments',
    title: 'Assessments',
    icon: 'assignment',
    roles: ['reviewee'],
    articles: [
      {
        id: 'what-are-assessments',
        question: 'What are Assessments?',
        content: [
          { type: 'p', text: 'Assessments are activities designed to help measure your current performance and competency. Assessment results can help identify:' },
          { type: 'ul', items: ['Strengths', 'Weaknesses', 'Subject-level performance', 'Areas that may require additional review'] },
        ],
      },
      {
        id: 'how-to-use-assessment-results',
        question: 'How should I use my Assessment results?',
        content: [
          { type: 'p', text: 'Use assessment results as a guide for your study planning. For example, if your performance is consistently lower in a particular subject, you may consider allocating additional review time to that subject.' },
          { type: 'p', text: 'Assessment results are indicators of your performance within BarBuddy and do not guarantee actual Bar Examination performance.' },
        ],
      },
    ],
  },

  {
    id: 'subscription',
    title: 'Subscription',
    icon: 'workspace_premium',
    roles: ['reviewee'],
    articles: [
      {
        id: 'how-to-subscribe',
        question: 'How do I subscribe to BarBuddy?',
        content: [
          {
            type: 'ol',
            items: [
              'Open the Subscription page.',
              'Review the available packages.',
              'Select your preferred package.',
              'Proceed to the payment process.',
              'Complete the required payment information.',
              'Complete the transaction.',
              'Once the payment is successfully processed and confirmed, your subscription access will be updated.',
            ],
          },
        ],
      },
      {
        id: 'check-current-subscription',
        question: 'How do I check my current subscription?',
        content: [
          { type: 'p', text: 'Go to Subscription → Current Subscription. Depending on the available information, you can view:' },
          { type: 'ul', items: ['Current package', 'Subscription status', 'Subscription start date', 'Subscription expiration date', 'Other applicable subscription information'] },
        ],
      },
      {
        id: 'payment-history',
        question: 'Where can I view my Payment History?',
        content: [
          { type: 'p', text: 'Go to Subscription → Payment History. Your Payment History allows you to review previous transactions associated with your BarBuddy account. Information may include:' },
          { type: 'ul', items: ['Transaction ID', 'Payment date', 'Subscription package', 'Amount', 'Payment method', 'Payment status'] },
        ],
      },
      {
        id: 'payment-failed',
        question: 'What should I do if my payment failed?',
        content: [
          {
            type: 'ol',
            items: [
              'Check your payment information.',
              'Confirm that your payment method is available.',
              'Try the transaction again if appropriate.',
              'Check whether your subscription status was updated.',
              'Contact BarBuddy Support if the issue continues.',
            ],
          },
          { type: 'p', text: 'Avoid repeatedly submitting a payment when you are unsure whether a previous transaction was successful.' },
        ],
      },
    ],
  },

  {
    id: 'account-profile',
    title: 'Account & Profile',
    icon: 'account_circle',
    roles: ALL_ROLES,
    articles: [
      {
        id: 'manage-profile',
        question: 'How do I manage my profile?',
        content: [
          { type: 'p', text: 'Go to Settings → Account & Profile. Depending on your account configuration, you may manage:' },
          { type: 'ul', items: ['First Name', 'Last Name', 'Email Address', 'Contact Information', 'Profile Photo'] },
          { type: 'p', text: 'Certain registration information may be displayed as part of your account details.' },
        ],
      },
      {
        id: 'bar-application-classification',
        question: 'What is my Bar Application classification?',
        content: [
          { type: 'p', text: 'BarBuddy may identify your Bar application classification based on the information provided during registration. Available classifications include:' },
          { type: 'ul', items: ['New Applicant', 'Retaker', 'Refresher'] },
          { type: 'p', text: 'This information helps describe your current review context.' },
        ],
        roles: ['reviewee'],
      },
    ],
  },

  {
    id: 'notifications',
    title: 'Notifications',
    icon: 'notifications',
    roles: ALL_ROLES,
    articles: [
      {
        id: 'manage-notifications',
        question: 'How do I manage email notifications?',
        content: [
          { type: 'p', text: 'Go to Settings → Notifications. You can manage the available email notification preferences. Depending on your account and the available settings, notifications may include review reminders, daily question reminders, study streak reminders, achievement notifications, subscription notifications, and system announcements.' },
        ],
      },
    ],
  },

  {
    id: 'appearance',
    title: 'Appearance',
    icon: 'palette',
    roles: ALL_ROLES,
    articles: [
      {
        id: 'change-theme',
        question: 'Can I change the BarBuddy theme?',
        content: [
          { type: 'p', text: 'Yes. Go to Settings → Appearance. Available theme options may include:' },
          {
            type: 'ul',
            items: [
              'Light — Uses the standard light interface.',
              'Dark — Uses a darker interface designed for lower-light environments.',
              "System — Automatically follows your device or operating system's appearance preference.",
            ],
          },
        ],
      },
      {
        id: 'change-font-size',
        question: 'Can I change the font size?',
        content: [{ type: 'p', text: 'If available, you can change the font size under Settings → Appearance → Font Size. This allows you to select the interface size that is most comfortable for you.' }],
      },
    ],
  },

  {
    id: 'privacy-security',
    title: 'Privacy & Security',
    icon: 'shield',
    roles: ALL_ROLES,
    articles: [
      {
        id: 'change-password',
        question: 'How do I change my password?',
        content: [
          { type: 'p', text: 'Go to Settings → Privacy & Security → Change Password. Enter your current password, new password, and confirmation of the new password.' },
          { type: 'p', text: 'Use a strong and unique password that you do not use for other accounts.' },
        ],
      },
      {
        id: 'what-is-2fa',
        question: 'What is Two-Factor Authentication?',
        content: [{ type: 'p', text: 'Two-Factor Authentication (2FA) provides an additional layer of account security. When enabled, signing in may require an additional verification step in addition to your password.' }],
      },
      {
        id: 'active-sessions',
        question: 'How do I check my active sessions?',
        content: [
          { type: 'p', text: 'Go to Settings → Privacy & Security → Active Sessions / Devices. You can review the sessions or devices currently associated with your account.' },
          { type: 'p', text: 'If you see a session you do not recognize, secure your account immediately.' },
        ],
      },
      {
        id: 'login-history',
        question: 'How do I check my Login History?',
        content: [
          { type: 'p', text: 'Go to Settings → Privacy & Security → Login History. Your login history may include information such as date and time, device, browser, and login status.' },
          { type: 'p', text: 'If you notice suspicious activity, change your password and contact BarBuddy Support.' },
        ],
      },
    ],
  },

  {
    id: 'lawyer-guides',
    title: 'Lawyer / Answer Verifier Guides',
    icon: 'balance',
    roles: ['lawyer', 'superadmin'],
    note: 'This section is visible to Lawyer / Answer Verifier accounts and authorized administrators.',
    articles: [
      {
        id: 'verification-process',
        question: 'What is the Lawyer Verification process?',
        content: [
          { type: 'p', text: 'Lawyers or designated answer verifiers review submitted reviewee answers according to the applicable BarBuddy evaluation criteria. The verification process may involve:' },
          {
            type: 'ol',
            items: [
              'Opening an assigned answer.',
              'Reviewing the question and relevant facts.',
              "Reviewing the reviewee's response.",
              'Assessing the legal conclusion.',
              'Checking the legal basis.',
              'Evaluating the application of law to the facts.',
              'Reviewing the conclusion.',
              'Assigning the appropriate qualitative score.',
              'Providing relevant feedback.',
              'Submitting the verified evaluation.',
            ],
          },
        ],
      },
      {
        id: 'verification-considerations',
        question: 'What should I consider when verifying an answer?',
        content: [
          { type: 'p', text: 'Consider the following:' },
          {
            type: 'ul',
            items: [
              'Answer — Is the legal conclusion clear, definitive, and correct?',
              'Legal Basis — Does the response identify the correct and relevant legal authority?',
              'Application — Does the response properly connect the law to the facts?',
              'Conclusion — Does the conclusion logically summarize the analysis?',
            ],
          },
          { type: 'p', text: 'Also consider the overall clarity, completeness, legal reasoning, and communication of the response.' },
        ],
      },
      {
        id: 'grading-standard-verification',
        question: 'How does the five-point grading standard apply to verification?',
        content: [
          { type: 'p', text: 'The verifier should assign the score that most closely corresponds to the applicable qualitative standard. The score should reflect the overall quality of the response based on the established evaluation criteria.' },
          { type: 'p', text: 'Verifiers should avoid assigning scores based solely on one element of the response.' },
        ],
      },
      {
        id: 'changing-verified-answer',
        question: 'Can a lawyer change a verified answer?',
        content: [
          { type: 'p', text: "Changes to a submitted verification should follow BarBuddy's configured verification workflow." },
          { type: 'p', text: 'If a correction is necessary after submission, use the available revision or correction process rather than creating a duplicate evaluation.' },
        ],
      },
    ],
  },

  {
    id: 'superadmin-guides',
    title: 'Superadmin / Administrator Guides',
    icon: 'admin_panel_settings',
    roles: ['superadmin'],
    note: 'This section is visible only to authorized administrator accounts.',
    articles: [
      {
        id: 'what-can-superadmin-manage',
        question: 'What can a Superadmin manage?',
        content: [
          { type: 'p', text: 'Depending on assigned permissions, Superadmins may manage and monitor:' },
          {
            type: 'ul',
            items: [
              'User accounts',
              'Lawyer/verifier accounts',
              'Reviewee accounts',
              'Subscription plans',
              'Payment records',
              'Review content',
              'Verification activities',
              'System logs',
              'Audit logs',
              'System settings',
            ],
          },
        ],
      },
      {
        id: 'what-are-payment-logs',
        question: 'What are Payment Logs?',
        content: [
          { type: 'p', text: 'Payment Logs allow authorized administrators to monitor payment transactions across BarBuddy. Payment records may include:' },
          { type: 'ul', items: ['Transaction ID', 'Reviewee', 'Subscription package', 'Amount', 'Payment method', 'Payment status', 'Transaction date'] },
          { type: 'p', text: 'Payment information should be handled only by authorized personnel.' },
        ],
      },
      {
        id: 'what-are-system-logs',
        question: 'What are System Logs?',
        content: [
          { type: 'p', text: 'System Logs record relevant system events and technical activity within BarBuddy. They may assist administrators in:' },
          { type: 'ul', items: ['Monitoring system activity', 'Investigating technical problems', 'Identifying errors', 'Troubleshooting issues'] },
        ],
      },
      {
        id: 'what-are-audit-logs',
        question: 'What are Audit Logs?',
        content: [
          { type: 'p', text: 'Audit Logs record significant administrative actions performed within the system. They help maintain accountability and traceability for important system operations.' },
          { type: 'p', text: 'Audit information should only be accessed by authorized administrators.' },
        ],
      },
    ],
  },

  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: 'build',
    roles: ALL_ROLES,
    articles: [
      {
        id: 'page-not-loading',
        question: 'My page is not loading correctly. What should I do?',
        content: [
          {
            type: 'ol',
            items: [
              'Refresh the page.',
              'Check your internet connection.',
              'Sign out and sign back in.',
              'Clear your browser cache if necessary.',
              'Try using an updated browser.',
              'Contact BarBuddy Support if the issue continues.',
            ],
          },
        ],
      },
      {
        id: 'answer-not-appearing',
        question: 'My answer is not appearing after submission.',
        content: [
          { type: 'p', text: 'First, check your answer history and the relevant question. If the submission is still missing:' },
          {
            type: 'ul',
            items: ['Do not repeatedly submit the same answer.', 'Refresh the page.', 'Check your internet connection.', 'Contact BarBuddy Support and provide the relevant question or transaction information.'],
          },
        ],
        roles: ['reviewee'],
      },
      {
        id: 'achievement-not-unlocking',
        question: 'My Achievement did not unlock.',
        content: [
          { type: 'p', text: 'Check the achievement\'s requirement and your current progress. If you have already satisfied the requirement but the achievement remains locked:' },
          {
            type: 'ol',
            items: [
              'Refresh your Achievements page.',
              'Check your current progress.',
              'Confirm that the requirement has actually been satisfied.',
              'Report the issue through Settings → Help & Support → Report a Problem if it remains locked.',
            ],
          },
        ],
        roles: ['reviewee'],
      },
      {
        id: 'badge-not-unlocking',
        question: 'My Badge did not unlock.',
        content: [
          { type: 'p', text: "Check the badge's unlocking requirement and the associated achievement or activity." },
          { type: 'p', text: 'If the requirement has been satisfied but the badge remains locked, report the issue to BarBuddy Support.' },
        ],
        roles: ['reviewee'],
      },
      {
        id: 'cannot-access-subscription',
        question: 'I cannot access my subscription.',
        content: [
          { type: 'p', text: 'Check your subscription status under Subscription → Current Subscription. If your subscription is active but the expected content remains unavailable:' },
          { type: 'ol', items: ['Refresh the page.', 'Sign out and sign back in.', 'Verify your subscription information.', 'Contact Support if the problem continues.'] },
        ],
        roles: ['reviewee'],
      },
      {
        id: 'unfamiliar-login',
        question: 'I see an unfamiliar login.',
        content: [
          { type: 'p', text: 'If you notice a login or active session that you do not recognize:' },
          {
            type: 'ol',
            items: [
              'Change your password immediately.',
              'Review your active sessions.',
              'Sign out of unfamiliar sessions if possible.',
              'Enable Two-Factor Authentication if available.',
              'Contact BarBuddy Support.',
            ],
          },
        ],
      },
    ],
  },

  {
    id: 'faq',
    title: 'Frequently Asked Questions',
    icon: 'help',
    roles: ALL_ROLES,
    articles: [
      {
        id: 'guarantee-pass',
        question: 'Does BarBuddy guarantee that I will pass the Bar Examination?',
        content: [{ type: 'p', text: "No. BarBuddy is a review and learning platform. Its scores, competency indicators, assessments, achievements, and recommendations do not guarantee success in the Philippine Bar Examination." }],
        roles: ['reviewee'],
      },
      {
        id: 'scores-official',
        question: "Are BarBuddy's scores official Bar Examination scores?",
        content: [
          { type: 'p', text: "No. BarBuddy's scores are generated for learning, assessment, and progress monitoring within the platform." },
          { type: 'p', text: 'They are not official scores issued by the Supreme Court of the Philippines.' },
        ],
        roles: ['reviewee', 'lawyer'],
      },
      {
        id: 'ai-always-correct',
        question: 'Is AI feedback always correct?',
        content: [{ type: 'p', text: 'No. AI-generated feedback may contain errors or inaccuracies. Reviewees should verify legal information against authoritative legal sources.' }],
        roles: ['reviewee'],
      },
      {
        id: 'use-without-subscription',
        question: 'Can I use BarBuddy without a subscription?',
        content: [{ type: 'p', text: 'Access depends on the subscription and account policies currently implemented by BarBuddy. Check the Subscription page for available packages and access information.' }],
        roles: ['reviewee'],
      },
    ],
  },

  {
    id: 'help-support',
    title: 'Help & Support',
    icon: 'support_agent',
    roles: ALL_ROLES,
    articles: [
      {
        id: 'contact-support-howto',
        question: 'How do I contact BarBuddy Support?',
        content: [
          { type: 'p', text: 'Go to Settings → Help & Support → Contact Support. Describe your concern clearly and provide relevant information that can help the support team investigate the issue.' },
          { type: 'p', text: 'Do not provide passwords, authentication codes, payment-card security codes, or other account credentials.' },
        ],
      },
      {
        id: 'report-problem-howto',
        question: 'How do I report a problem?',
        content: [
          { type: 'p', text: 'Go to Settings → Help & Support → Report a Problem. Include:' },
          { type: 'ul', items: ['A description of the problem', 'The page where the problem occurred', 'What you were trying to do', 'Any error message displayed', 'The approximate date and time of the issue'] },
          { type: 'p', text: 'If supported, include a screenshot that demonstrates the problem.' },
        ],
      },
    ],
  },

  {
    id: 'about',
    title: 'About BarBuddy',
    icon: 'info',
    roles: ALL_ROLES,
    articles: [
      {
        id: 'disclaimer',
        question: 'Important Disclaimer',
        content: [
          { type: 'p', text: 'BarBuddy is an educational and review platform developed to support candidates preparing for the Philippine Bar Examination.' },
          { type: 'p', text: "BarBuddy's assessments, competency scores, AI-generated feedback, achievements, badges, and recommendations are intended for educational and progress-monitoring purposes only. They do not constitute:" },
          {
            type: 'ul',
            items: [
              'Official Philippine Bar Examination results',
              'An official prediction of Bar Examination performance',
              'Legal advice',
              'A substitute for authoritative legal research',
              'A substitute for official Supreme Court announcements, rules, or issuances',
            ],
          },
          { type: 'p', text: 'Users should consult the latest official materials and issuances of the Supreme Court of the Philippines for authoritative information regarding the Philippine Bar Examination.' },
        ],
      },
      {
        id: 'references',
        question: 'References',
        content: [
          { type: 'p', text: "BarBuddy's evaluation and competency framework may refer to official Philippine Bar Examination materials and issuances, including:" },
          {
            type: 'ul',
            items: [
              'Supreme Court of the Philippines. (2021, February 15). Bar Bulletin No. 2, Series of 2021: Localized and digitalized 2020/2021 Bar examinations.',
              'Supreme Court of the Philippines. (2025). Bar Bulletin No. 4, Series of 2025.',
            ],
          },
          { type: 'p', text: 'For the latest official Bar Examination rules, policies, announcements, and issuances, consult the official website of the Supreme Court of the Philippines.' },
        ],
      },
    ],
  },
];

// Filters categories/articles down to what a given role should see, and
// drops any category left with zero visible articles.
export function getHelpCategoriesForRole(role) {
  return HELP_CATEGORIES.filter((cat) => cat.roles.includes(role))
    .map((cat) => ({
      ...cat,
      articles: cat.articles.filter((a) => (a.roles ?? cat.roles).includes(role)),
    }))
    .filter((cat) => cat.articles.length > 0);
}

// Simple case-insensitive search across question text and paragraph/list
// content within a role-filtered category list.
export function searchHelpCategories(categories, term) {
  const q = term.trim().toLowerCase();
  if (!q) return categories;

  const blockMatches = (block) => {
    if (block.type === 'p' || block.type === 'h5' || block.type === 'formula') return block.text.toLowerCase().includes(q);
    if (block.type === 'ul' || block.type === 'ol') return block.items.some((i) => i.toLowerCase().includes(q));
    if (block.type === 'table') return block.rows.some((row) => row.some((cell) => cell.toLowerCase().includes(q)));
    return false;
  };

  return categories
    .map((cat) => ({
      ...cat,
      articles: cat.articles.filter((a) => a.question.toLowerCase().includes(q) || a.content.some(blockMatches)),
    }))
    .filter((cat) => cat.articles.length > 0);
}
