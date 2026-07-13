// AUTO-GENERATED from src/skills/*.html by /tmp/parse-skills.mjs — do not edit by hand.
// 57 GTM Skills with full detail sections (overview, questions, steps, inputs, prompts, integrations).
export const SKILLS_CATALOG = [
  {
    "slug": "abm-and-account-intelligence",
    "name": "ABM & Account Intelligence",
    "description": "Know whether you're engaging the right target accounts with enough depth across the right roles, and exactly where you're at risk.",
    "type": "dashboard",
    "time": "~11 min",
    "workstream": "abm",
    "connectors": [
      "Salesforce",
      "6sense",
      "HubSpot",
      "LinkedIn Ads"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 5 widgets that answer the questions below. Build time on typical data: ~11 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~11 min covering 5 distinct widgets. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "How does our target-account engagement break down by role and signal?",
      "Which target accounts are at risk because we've only engaged the wrong personas?",
      "Where do the hottest signals concentrate?",
      "Which accounts are hidden in plain sight: engaged but not yet in pipeline?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, 6sense, HubSpot, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 5 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Target list scope: Tier 1 only or full named-account list?",
      "Risk thresholds: depth, breadth, or recency?",
      "Hidden-accounts threshold: minimum engagement, no opp open?"
    ],
    "prompts": [
      "Run ABM & Account Intelligence for the last quarter.",
      "How does our target-account engagement break down by role and signal?",
      "Which target accounts are at risk because we've only engaged the wrong personas?",
      "Where do the hottest signals concentrate?",
      "Which accounts are hidden in plain sight: engaged but not yet in pipeline?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "6sense",
        "desc": "Third-party intent data and account-level surge signals."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      }
    ]
  },
  {
    "slug": "abm-campaign-account-reach",
    "name": "ABM Campaign Account Reach",
    "description": "Track which target accounts ABM campaigns actually reach. Joins ad-platform reach data with the target account list, surfaces hit rate, untouched accounts, and wasted reach. Replaces the monthly Excel exercise with a live dashboard.",
    "type": "dashboard",
    "time": "~9 min",
    "workstream": "abm",
    "connectors": [
      "Salesforce",
      "6sense",
      "LinkedIn Ads",
      "HubSpot"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 7 widgets that answer the questions below. Build time on typical data: ~9 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~9 min covering 7 distinct widgets. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which target accounts are our ABM campaigns actually reaching?",
      "Which target accounts have zero meaningful reach?",
      "How does reach intensity correlate with downstream engagement?",
      "Where is campaign spend leaking to non-target accounts?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, 6sense, LinkedIn Ads, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 7 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Which campaigns: all active ABM campaigns, or specific set?",
      "Time window: trailing 30, 60, or 90 days?",
      "Reach intensity threshold: 3, 5, or 10 impressions per individual?"
    ],
    "prompts": [
      "Run ABM Campaign Account Reach for the last quarter.",
      "Which target accounts are our ABM campaigns actually reaching?",
      "Which target accounts have zero meaningful reach?",
      "How does reach intensity correlate with downstream engagement?",
      "Where is campaign spend leaking to non-target accounts?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "6sense",
        "desc": "Third-party intent data and account-level surge signals."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      }
    ]
  },
  {
    "slug": "abm-campaign-penetration",
    "name": "ABM Campaign Penetration",
    "description": "Know whether your campaigns are reaching the target accounts that matter, or burning spend on everyone else.",
    "type": "dashboard",
    "time": "~10 min",
    "workstream": "abm",
    "connectors": [
      "Salesforce",
      "6sense",
      "LinkedIn Ads",
      "HubSpot"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 5 widgets that answer the questions below. Build time on typical data: ~10 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~10 min covering 5 distinct widgets. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "What share of campaign spend reached our target list?",
      "Which campaigns are wasting impressions on non-targets?",
      "Where are we under-saturating our target accounts?",
      "How do channels compare on target-list reach?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, 6sense, LinkedIn Ads, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 5 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Target list: single ABM list or all named-account lists?",
      "Campaigns to include: paid only, or all touch types?",
      "Window: last 30, 60, or 90 days?"
    ],
    "prompts": [
      "Run ABM Campaign Penetration for the last quarter.",
      "What share of campaign spend reached our target list?",
      "Which campaigns are wasting impressions on non-targets?",
      "Where are we under-saturating our target accounts?",
      "How do channels compare on target-list reach?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "6sense",
        "desc": "Third-party intent data and account-level surge signals."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      }
    ]
  },
  {
    "slug": "abm-target-account-monitoring",
    "name": "ABM Target Account Monitoring",
    "description": "Know which of your named accounts are warming up, which just went cold, and which quietly converted to pipeline this week.",
    "type": "dashboard",
    "time": "~9 min",
    "workstream": "abm",
    "connectors": [
      "Salesforce",
      "6sense",
      "HubSpot"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 6 widgets that answer the questions below. Build time on typical data: ~9 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~9 min covering 6 distinct widgets. Every value is source-linked back to 3 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which target accounts changed status in the last 7 days?",
      "Where did engagement spike unexpectedly?",
      "Which accounts went cold and what was the last touch?",
      "How many target accounts moved into pipeline this week?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, 6sense, HubSpot. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 6 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Target list: all-tiers or specific tier?",
      "Heat thresholds: 6sense intent score, or custom?",
      "Lookback window: 7, 14, or 30 days?"
    ],
    "prompts": [
      "Run ABM Target Account Monitoring for the last quarter.",
      "Which target accounts changed status in the last 7 days?",
      "Where did engagement spike unexpectedly?",
      "Which accounts went cold and what was the last touch?",
      "How many target accounts moved into pipeline this week?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "6sense",
        "desc": "Third-party intent data and account-level surge signals."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      }
    ]
  },
  {
    "slug": "account-engagement-ranking",
    "name": "Account Engagement Ranking",
    "description": "Give your AEs a ranked list of the hottest accounts right now, and a flag list of the target accounts that have gone quiet.",
    "type": "dashboard",
    "time": "~8 min",
    "workstream": "abm",
    "connectors": [
      "Salesforce",
      "6sense",
      "HubSpot"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 5 widgets that answer the questions below. Build time on typical data: ~8 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~8 min covering 5 distinct widgets. Every value is source-linked back to 3 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which 20 accounts should each AE call this week?",
      "Where is engagement above the team baseline?",
      "Which accounts have stopped engaging in the last 14 days?",
      "How does engagement break down by AE territory?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, 6sense, HubSpot. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 5 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Ranking horizon: last 7, 14, or 30 days?",
      "Score weighting: recency, frequency, or both?",
      "Show by AE territory or aggregate?"
    ],
    "prompts": [
      "Run Account Engagement Ranking for the last quarter.",
      "Which 20 accounts should each AE call this week?",
      "Where is engagement above the team baseline?",
      "Which accounts have stopped engaging in the last 14 days?",
      "How does engagement break down by AE territory?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "6sense",
        "desc": "Third-party intent data and account-level surge signals."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      }
    ]
  },
  {
    "slug": "account-engagement-velocity",
    "name": "Account Engagement Velocity",
    "description": "Surface accounts that are warming up vs. cooling down vs. stalled: the trajectory question that decides where ABM should focus this week. Replaces weekly manual account reviews that can't reach every account.",
    "type": "dashboard",
    "time": "~9 min",
    "workstream": "abm",
    "connectors": [
      "Salesforce",
      "6sense",
      "HubSpot",
      "Outreach"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 8 widgets that answer the questions below. Build time on typical data: ~9 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~9 min covering 8 distinct widgets. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which target accounts are accelerating right now?",
      "Which accounts cooled despite earlier engagement?",
      "Which accounts have never engaged and should be re-evaluated?",
      "How does velocity differ across tiers and segments?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, 6sense, HubSpot, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 8 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Account list: target accounts only, or include named-account list?",
      "Velocity window: trailing 4 weeks (8-week baseline) or custom?",
      "Signal types: all connected, or filter to specific channels?"
    ],
    "prompts": [
      "Run Account Engagement Velocity for the last quarter.",
      "Which target accounts are accelerating right now?",
      "Which accounts cooled despite earlier engagement?",
      "Which accounts have never engaged and should be re-evaluated?",
      "How does velocity differ across tiers and segments?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "6sense",
        "desc": "Third-party intent data and account-level surge signals."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "Outreach",
        "desc": "Sales engagement sequences, rep activity, response rates."
      }
    ]
  },
  {
    "slug": "account-intent-shift-brief",
    "name": "Account Intent Shift Brief",
    "description": "Single-account narrative explaining a meaningful shift in engagement: what changed, who's engaging, what signals surfaced, what action makes sense. Replaces the cross-functional reconstruction meeting where AE / SDR / marketing each share part of the picture.",
    "type": "memo",
    "time": "~11 min",
    "workstream": "abm",
    "connectors": [
      "Salesforce",
      "6sense",
      "HubSpot",
      "Outreach",
      "Gong"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 5 sections that answer the questions below. Build time on typical data: ~11 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~11 min covering 5 distinct sections. Every value is source-linked back to 5 integrations and computed using your team's canonical definitions.",
    "questions": [
      "What's happening at this account right now?",
      "Who in the buying group is engaging, and on what topics?",
      "How material is this trajectory shift, with what confidence?",
      "Which contacts should the AE / SDR reach out to next, and how?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, 6sense, HubSpot, and 2 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 5 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Which account: by name or Salesforce ID (required)?",
      "Lookback window: trailing 8 or 12 weeks?",
      "Include third-party intent overlay (if connected)?"
    ],
    "prompts": [
      "Run Account Intent Shift Brief for the last quarter.",
      "What's happening at this account right now?",
      "Who in the buying group is engaging, and on what topics?",
      "How material is this trajectory shift, with what confidence?",
      "Which contacts should the AE / SDR reach out to next, and how?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "6sense",
        "desc": "Third-party intent data and account-level surge signals."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "Outreach",
        "desc": "Sales engagement sequences, rep activity, response rates."
      },
      {
        "name": "Gong",
        "desc": "Conversation intelligence, call outcomes, and deal-risk signals."
      }
    ]
  },
  {
    "slug": "activity-to-outcome-correlation",
    "name": "Activity-to-Outcome Correlation",
    "description": "Compare activity patterns on closed-won vs closed-lost deals to surface which behaviors actually move pipeline. Replaces received-wisdom playbooks with data-grounded correlation analysis. \"This isn't actually working\" findings are surfaced explicitly.",
    "type": "memo",
    "time": "~14 min",
    "workstream": "sales-activity",
    "connectors": [
      "Salesforce",
      "Outreach",
      "Gong"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 5 sections that answer the questions below. Build time on typical data: ~14 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~14 min covering 5 distinct sections. Every value is source-linked back to 3 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which activity patterns correlate with winning deals on our data?",
      "Which playbook prescriptions don't actually correlate with outcomes?",
      "Which activities show statistically significant effect sizes?",
      "What playbook adjustments are grounded in our own data?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, Outreach, Gong. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 5 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Time window: trailing 12 months of closed deals, or custom?",
      "Deal segments: all closed deals above $10K, or specific tier/segment?",
      "Comparison method: won vs lost with control for size/segment, or raw?"
    ],
    "prompts": [
      "Run Activity-to-Outcome Correlation for the last quarter.",
      "Which activity patterns correlate with winning deals on our data?",
      "Which playbook prescriptions don't actually correlate with outcomes?",
      "Which activities show statistically significant effect sizes?",
      "What playbook adjustments are grounded in our own data?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "Outreach",
        "desc": "Sales engagement sequences, rep activity, response rates."
      },
      {
        "name": "Gong",
        "desc": "Conversation intelligence, call outcomes, and deal-risk signals."
      }
    ]
  },
  {
    "slug": "attribution-model-comparison",
    "name": "Attribution Model Comparison",
    "description": "Compare attribution models side-by-side against the same opportunity dataset, surface where they disagree, and recommend a canonical model with rationale. Replaces 4–6 hours of MOps reconciliation per cycle with a defensible memo in minutes.",
    "type": "memo",
    "time": "~12 min",
    "workstream": "attribution",
    "connectors": [
      "Salesforce",
      "HubSpot",
      "Google Ads",
      "LinkedIn Ads"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 5 sections that answer the questions below. Build time on typical data: ~12 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~12 min covering 5 distinct sections. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Where do our attribution models disagree, and by how much, on which channels?",
      "Which model should be canonical for board reporting, and why?",
      "How much credit shifts between last-touch and multi-touch on the same deals?",
      "How confident can we be in the canonical recommendation given our data completeness?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot, Google Ads, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 5 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Which models: last-touch, first-touch, linear, U/W-shaped, time-decay, custom?",
      "Time window: last 90 days, last quarter, or custom?",
      "Anchor metric: SQL opportunity count or pipeline value?"
    ],
    "prompts": [
      "Run Attribution Model Comparison for the last quarter.",
      "Where do our attribution models disagree, and by how much, on which channels?",
      "Which model should be canonical for board reporting, and why?",
      "How much credit shifts between last-touch and multi-touch on the same deals?",
      "How confident can we be in the canonical recommendation given our data completeness?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "Google Ads",
        "desc": "Paid search spend, campaign performance, and conversions."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      }
    ]
  },
  {
    "slug": "audience-performance",
    "name": "Audience Performance",
    "description": "Rank audience cohorts by ROAS within and across ad platforms. Saturation indicators, overlap analysis, and expansion candidate flags so audiences get scaled or replaced on data, not gut.",
    "type": "dashboard",
    "time": "~10 min",
    "workstream": "roas",
    "connectors": [
      "Google Ads",
      "LinkedIn Ads",
      "Meta Ads",
      "Salesforce",
      "6sense"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 7 widgets that answer the questions below. Build time on typical data: ~10 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~10 min covering 7 distinct widgets. Every value is source-linked back to 5 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which audiences are saturating and need expansion or replacement?",
      "Which expansion candidates should we scale next month?",
      "Where do audiences overlap and waste impressions?",
      "Which audience–channel pairings are most efficient?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Google Ads, LinkedIn Ads, Meta Ads, and 2 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 7 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Time window: trailing 30 days, or custom?",
      "ROAS variant: pipeline or revenue?",
      "Channels: all platforms with audience-level data?"
    ],
    "prompts": [
      "Run Audience Performance for the last quarter.",
      "Which audiences are saturating and need expansion or replacement?",
      "Which expansion candidates should we scale next month?",
      "Where do audiences overlap and waste impressions?",
      "Which audience–channel pairings are most efficient?"
    ],
    "integrations": [
      {
        "name": "Google Ads",
        "desc": "Paid search spend, campaign performance, and conversions."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      },
      {
        "name": "Meta Ads",
        "desc": "Paid social on Facebook & Instagram: audience and creative performance."
      },
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "6sense",
        "desc": "Third-party intent data and account-level surge signals."
      }
    ]
  },
  {
    "slug": "budget-pacing",
    "name": "Budget Pacing",
    "description": "Track actual ad spend against the configured budget, with end-of-period projections and pacing health indicators. Replaces the spreadsheet pacing math every Friday afternoon.",
    "type": "dashboard",
    "time": "~8 min",
    "workstream": "roas",
    "connectors": [
      "Google Ads",
      "LinkedIn Ads",
      "Meta Ads"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 6 widgets that answer the questions below. Build time on typical data: ~8 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~8 min covering 6 distinct widgets. Every value is source-linked back to 3 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Are we on pace to hit budget this period?",
      "Which channels are accelerating or decelerating relative to plan?",
      "What's the projected end-of-period overspend or underspend?",
      "Which pacing alerts are critical vs. just worth watching?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Google Ads, LinkedIn Ads, Meta Ads. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 6 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Budget period: current calendar month, fiscal month, or quarter?",
      "Per-channel breakdown: yes (require channel-level budgets) or blended only?",
      "Pacing health threshold: ±5%, ±10%, or custom?"
    ],
    "prompts": [
      "Run Budget Pacing for the last quarter.",
      "Are we on pace to hit budget this period?",
      "Which channels are accelerating or decelerating relative to plan?",
      "What's the projected end-of-period overspend or underspend?",
      "Which pacing alerts are critical vs. just worth watching?"
    ],
    "integrations": [
      {
        "name": "Google Ads",
        "desc": "Paid search spend, campaign performance, and conversions."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      },
      {
        "name": "Meta Ads",
        "desc": "Paid social on Facebook & Instagram: audience and creative performance."
      }
    ]
  },
  {
    "slug": "buyer-journey-analysis",
    "name": "Buyer Journey Analysis",
    "description": "See every touch that happened on a single account, and get a prioritized next-best-action grounded in how your won deals actually played out.",
    "type": "memo",
    "time": "~12 min",
    "workstream": "abm",
    "connectors": [
      "Salesforce",
      "6sense",
      "HubSpot",
      "Outreach"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 5 sections that answer the questions below. Build time on typical data: ~12 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~12 min covering 5 distinct sections. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "What does the typical winning journey look like for this segment?",
      "Where is this account vs. the winning pattern?",
      "What's the highest-value next action?",
      "Which signals predict a stall or a stuck deal?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, 6sense, HubSpot, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 5 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Which account: by name, ID, or top-N-from-list?",
      "Pattern reference: last quarter's wins, all-time wins, or custom?",
      "Channels to include: email, content, events, ad-engagement?"
    ],
    "prompts": [
      "Run Buyer Journey Analysis for the last quarter.",
      "What does the typical winning journey look like for this segment?",
      "Where is this account vs. the winning pattern?",
      "What's the highest-value next action?",
      "Which signals predict a stall or a stuck deal?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "6sense",
        "desc": "Third-party intent data and account-level surge signals."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "Outreach",
        "desc": "Sales engagement sequences, rep activity, response rates."
      }
    ]
  },
  {
    "slug": "buying-group-completeness",
    "name": "Buying Group Completeness",
    "description": "Track whether the right contacts at the right seniority levels are being engaged at target accounts: economic buyer, technical buyer, end user, champion, decision-maker. Replaces the late discovery that a deal stalled because the buying group was incomplete.",
    "type": "dashboard",
    "time": "~10 min",
    "workstream": "abm",
    "connectors": [
      "Salesforce",
      "6sense",
      "HubSpot",
      "LinkedIn Sales Navigator"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 7 widgets that answer the questions below. Build time on typical data: ~10 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~10 min covering 7 distinct widgets. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which open opportunities have incomplete buying-group coverage?",
      "Which roles are systematically under-engaged across our target accounts?",
      "Where do we have contacts but no engagement on the right roles?",
      "Which accounts have thin buying groups and need expansion?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, 6sense, HubSpot, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 7 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Account list: open opportunities, Tier 1 targets, or both?",
      "Buying-group definition: tenant config or override?",
      "Engagement window: trailing 8 or 12 weeks?"
    ],
    "prompts": [
      "Run Buying Group Completeness for the last quarter.",
      "Which open opportunities have incomplete buying-group coverage?",
      "Which roles are systematically under-engaged across our target accounts?",
      "Where do we have contacts but no engagement on the right roles?",
      "Which accounts have thin buying groups and need expansion?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "6sense",
        "desc": "Third-party intent data and account-level surge signals."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "LinkedIn Sales Navigator",
        "desc": "Buying-committee mapping and account intent signals."
      }
    ]
  },
  {
    "slug": "buying-unit-penetration",
    "name": "Buying-Unit Penetration",
    "description": "Know whether your team is covering the full buying committee at each target account, or single-threaded and quietly at risk.",
    "type": "dashboard",
    "time": "~9 min",
    "workstream": "abm",
    "connectors": [
      "Salesforce",
      "6sense",
      "HubSpot"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 5 widgets that answer the questions below. Build time on typical data: ~9 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~9 min covering 5 distinct widgets. Every value is source-linked back to 3 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which target accounts are dangerously single-threaded?",
      "Where are we engaged with users but missing economic buyers?",
      "Where have we never reached technical evaluators?",
      "Which roles have the lowest coverage across our target list?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, 6sense, HubSpot. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 5 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Buying-unit definition: by personas, by titles, or 6sense buying-stages?",
      "Account scope: all target accounts, or top tier only?",
      "Coverage threshold: at least N personas engaged in last M days?"
    ],
    "prompts": [
      "Run Buying-Unit Penetration for the last quarter.",
      "Which target accounts are dangerously single-threaded?",
      "Where are we engaged with users but missing economic buyers?",
      "Where have we never reached technical evaluators?",
      "Which roles have the lowest coverage across our target list?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "6sense",
        "desc": "Third-party intent data and account-level surge signals."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      }
    ]
  },
  {
    "slug": "campaign-performance",
    "name": "Campaign Performance",
    "description": "Rank campaigns by ROAS within and across channels, with the context needed to act. Top performers, bottom performers, scaling candidates, and ramp-up campaigns surfaced explicitly.",
    "type": "dashboard",
    "time": "~9 min",
    "workstream": "roas",
    "connectors": [
      "Salesforce",
      "Google Ads",
      "LinkedIn Ads",
      "Meta Ads"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 6 widgets that answer the questions below. Build time on typical data: ~9 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~9 min covering 6 distinct widgets. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which campaigns should we scale, pause, or refresh?",
      "Where are the top performers concentrated by channel?",
      "Which underperformers are likely creative-fatigue vs. audience-saturation?",
      "Which campaigns are still in ramp and shouldn't be judged yet?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, Google Ads, LinkedIn Ads, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 6 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Time window: trailing 30, 60, or 90 days?",
      "Canonical attribution model: tenant default or override?",
      "ROAS variant: pipeline or revenue?"
    ],
    "prompts": [
      "Run Campaign Performance for the last quarter.",
      "Which campaigns should we scale, pause, or refresh?",
      "Where are the top performers concentrated by channel?",
      "Which underperformers are likely creative-fatigue vs. audience-saturation?",
      "Which campaigns are still in ramp and shouldn't be judged yet?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "Google Ads",
        "desc": "Paid search spend, campaign performance, and conversions."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      },
      {
        "name": "Meta Ads",
        "desc": "Paid social on Facebook & Instagram: audience and creative performance."
      }
    ]
  },
  {
    "slug": "channel-mix-analysis",
    "name": "Channel Mix Analysis",
    "description": "Track how marketing channel mix has shifted over time, with consistent attribution definitions across periods. Period-over-period comparison is real because the underlying definitions are governed.",
    "type": "dashboard",
    "time": "~10 min",
    "workstream": "attribution",
    "connectors": [
      "Salesforce",
      "HubSpot",
      "Google Ads",
      "LinkedIn Ads",
      "Meta Ads"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 5 widgets that answer the questions below. Build time on typical data: ~10 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~10 min covering 5 distinct widgets. Every value is source-linked back to 5 integrations and computed using your team's canonical definitions.",
    "questions": [
      "How has our channel mix shifted over the last 4 quarters?",
      "Is LinkedIn genuinely growing, or did it just have a strong month?",
      "Which channels lost share fastest period-over-period?",
      "Where does the channel taxonomy diverge across our connected sources?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot, Google Ads, and 2 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 5 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Time period coverage: last 4 quarters, 8 quarters, or custom?",
      "Canonical attribution model: tenant default, or override for this view?",
      "Refresh schedule: daily, weekly, or on-demand only?"
    ],
    "prompts": [
      "Run Channel Mix Analysis for the last quarter.",
      "How has our channel mix shifted over the last 4 quarters?",
      "Is LinkedIn genuinely growing, or did it just have a strong month?",
      "Which channels lost share fastest period-over-period?",
      "Where does the channel taxonomy diverge across our connected sources?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "Google Ads",
        "desc": "Paid search spend, campaign performance, and conversions."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      },
      {
        "name": "Meta Ads",
        "desc": "Paid social on Facebook & Instagram: audience and creative performance."
      }
    ]
  },
  {
    "slug": "channel-performance-review",
    "name": "Channel Performance Review",
    "description": "Defend (or critique) a single advertising channel with structured evidence. Replaces the rushed pre-meeting prep when the CFO asks \"why are we still spending on LinkedIn?\"",
    "type": "memo",
    "time": "~12 min",
    "workstream": "roas",
    "connectors": [
      "Salesforce",
      "Google Ads",
      "LinkedIn Ads",
      "Meta Ads"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 5 sections that answer the questions below. Build time on typical data: ~12 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~12 min covering 5 distinct sections. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Why are we still spending on this channel?",
      "How has this channel evolved over the last quarter?",
      "What unique contribution does this channel make to the mix?",
      "Should we continue, scale, scale-back, or pause?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 4 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, Google Ads, LinkedIn Ads, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 4 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 5 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Which channel to review (required input: name)?",
      "Time window for current performance: trailing 90 days, or custom?",
      "Comparison period: prior 90 days, or year-over-year?",
      "Audience tone: CFO/CEO defensible, or marketing-team detailed?"
    ],
    "prompts": [
      "Run Channel Performance Review for the last quarter.",
      "Why are we still spending on this channel?",
      "How has this channel evolved over the last quarter?",
      "What unique contribution does this channel make to the mix?",
      "Should we continue, scale, scale-back, or pause?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "Google Ads",
        "desc": "Paid search spend, campaign performance, and conversions."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      },
      {
        "name": "Meta Ads",
        "desc": "Paid social on Facebook & Instagram: audience and creative performance."
      }
    ]
  },
  {
    "slug": "channel-roas",
    "name": "Paid Media ROI",
    "description": "Grade every paid channel against closed-won revenue — not platform-reported ROAS — and see where to move spend this week. One governed definition replaces the three different ROAS numbers leadership keeps citing.",
    "type": "dashboard",
    "time": "~8 min",
    "workstream": "roas",
    "connectors": [
      "Salesforce",
      "Google Ads",
      "LinkedIn Ads",
      "Meta Ads"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 5 widgets that answer the questions below. Build time on typical data: ~8 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~8 min covering 5 distinct widgets. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "What is our blended and per-channel ROAS right now?",
      "Which channels are below target, and by how much?",
      "How is ROAS trending over the last 30 days?",
      "Where is most of our spend concentrated relative to ROAS?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, Google Ads, LinkedIn Ads, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 5 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "ROAS variant: pipeline ROAS, revenue ROAS, or both?",
      "Time window: trailing 30, 60, or 90 days?",
      "ROAS target: tenant config per channel, or 3.0x blended fallback?"
    ],
    "prompts": [
      "Run Paid Media ROI for the last quarter.",
      "Which paid channels are actually driving demos, and where am I wasting spend?",
      "What is our true, CRM-grounded ROAS per channel right now?",
      "Which channels should we scale, hold, or cut this week?",
      "Which ICP accounts are engaging our ads but have no open pipeline?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "Google Ads",
        "desc": "Paid search spend, campaign performance, and conversions."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      },
      {
        "name": "Meta Ads",
        "desc": "Paid social on Facebook & Instagram: audience and creative performance."
      }
    ]
  },
  {
    "slug": "closed-won-journey-retrospective",
    "name": "Closed-Won Journey Retrospective",
    "description": "See the exact path your winning deals travel: the moves, timing, and content that actually close revenue, so your team can repeat what works on every deal.",
    "type": "memo",
    "time": "~14 min",
    "workstream": "funnel",
    "connectors": [
      "Salesforce",
      "HubSpot",
      "Outreach",
      "Gong"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 5 sections that answer the questions below. Build time on typical data: ~14 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~14 min covering 5 distinct sections. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "What does a typical winning deal look like, start to finish?",
      "Which emails, calls, and content show up again and again in deals we win?",
      "How does the winning path change for big deals vs. small, or by region?",
      "How long does a winning deal usually take, and where does it stall?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot, Outreach, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 5 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Which deals to look at: won in the last 90 days, last 4 quarters, or a range you pick?",
      "How to group them: by deal size, region, or buyer type?",
      "Which activity to include: marketing only, or marketing + sales outreach?"
    ],
    "prompts": [
      "Show me what a typical winning deal looks like, start to finish.",
      "Which emails, calls, and content show up most in the deals we win?",
      "How does the winning path differ for enterprise vs. mid-market?",
      "How long do winning deals take, and where do they slow down?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "Outreach",
        "desc": "Sales engagement sequences, rep activity, response rates."
      },
      {
        "name": "Gong",
        "desc": "Conversation intelligence, call outcomes, and deal-risk signals."
      }
    ]
  },
  {
    "slug": "content-performance-dashboard",
    "name": "Content Performance Dashboard",
    "description": "Know which landing pages and content assets actually convert, influence pipeline, and close revenue, and which are just traffic.",
    "type": "dashboard",
    "time": "~9 min",
    "workstream": "attribution",
    "connectors": [
      "Salesforce",
      "HubSpot",
      "GA4"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 5 widgets that answer the questions below. Build time on typical data: ~9 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~9 min covering 5 distinct widgets. Every value is source-linked back to 3 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which content assets are actually moving deals forward?",
      "Where do prospects engage and then go silent?",
      "Which assets get views but never produce conversions?",
      "How does content engagement differ by buyer persona?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot, GA4. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 5 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Define \"content asset\": landing pages only, or include eBooks, blogs, demos?",
      "Conversion benchmark: form fills, demo requests, or downstream pipeline?",
      "Window: last 30, 90, or 180 days?"
    ],
    "prompts": [
      "Run Content Performance Dashboard for the last quarter.",
      "Which content assets are actually moving deals forward?",
      "Where do prospects engage and then go silent?",
      "Which assets get views but never produce conversions?",
      "How does content engagement differ by buyer persona?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "GA4",
        "desc": "Web analytics: content engagement and traffic sources."
      }
    ]
  },
  {
    "slug": "creative-performance",
    "name": "Creative Performance",
    "description": "Rank ad creatives by performance with statistical-significance flags so marketers can distinguish meaningful signal from sample-size noise. Fatigue warnings and rotation recommendations included.",
    "type": "dashboard",
    "time": "~9 min",
    "workstream": "roas",
    "connectors": [
      "Google Ads",
      "LinkedIn Ads",
      "Meta Ads",
      "Salesforce"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 7 widgets that answer the questions below. Build time on typical data: ~9 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~9 min covering 7 distinct widgets. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which creatives are statistically winning vs. just lucky?",
      "Which creatives are fatiguing and need rotation?",
      "Which creative–audience pairings produce differential lift?",
      "When should we kill an underperforming creative vs. give it more time?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Google Ads, LinkedIn Ads, Meta Ads, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 7 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Time window: trailing 30 days, or custom?",
      "Significance threshold: p < 0.05, p < 0.10, or custom?",
      "Channels: all platforms with creative-level data, or specific platforms?"
    ],
    "prompts": [
      "Run Creative Performance for the last quarter.",
      "Which creatives are statistically winning vs. just lucky?",
      "Which creatives are fatiguing and need rotation?",
      "Which creative–audience pairings produce differential lift?",
      "When should we kill an underperforming creative vs. give it more time?"
    ],
    "integrations": [
      {
        "name": "Google Ads",
        "desc": "Paid search spend, campaign performance, and conversions."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      },
      {
        "name": "Meta Ads",
        "desc": "Paid social on Facebook & Instagram: audience and creative performance."
      },
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      }
    ]
  },
  {
    "slug": "deal-prioritization-brief",
    "name": "Deal Prioritization Brief",
    "description": "A weekly memo telling a rep where to focus this week: which open deals deserve effort, which signals matter, and which deals to consider de-prioritizing. Replaces gut-feel triage with explicit reasoning.",
    "type": "memo",
    "time": "~11 min",
    "workstream": "pipeline",
    "connectors": [
      "Salesforce",
      "Outreach",
      "Gong"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 4 sections that answer the questions below. Build time on typical data: ~11 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~11 min covering 4 distinct sections. Every value is source-linked back to 3 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which deals should I focus on this week, and why?",
      "Which open deals should I de-prioritize or close out?",
      "Which signals on each top deal demand attention right now?",
      "Where are managers and reps likely to disagree on priorities?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, Outreach, Gong. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 4 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Owner scope: single rep, or rolled up to a manager view?",
      "How many top deals to include: 5, 8, or 12?",
      "Include drop list: yes / no?"
    ],
    "prompts": [
      "Run Deal Prioritization Brief for the last quarter.",
      "Which deals should I focus on this week, and why?",
      "Which open deals should I de-prioritize or close out?",
      "Which signals on each top deal demand attention right now?",
      "Where are managers and reps likely to disagree on priorities?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "Outreach",
        "desc": "Sales engagement sequences, rep activity, response rates."
      },
      {
        "name": "Gong",
        "desc": "Conversation intelligence, call outcomes, and deal-risk signals."
      }
    ]
  },
  {
    "slug": "deal-source-brief",
    "name": "Deal Source Brief",
    "description": "Single-deal autopsy. Where the opp came from, what touches and activities shaped it, and how credit allocates under the canonical model. Saves 60–90 minutes of reconstruction every time the CRO asks.",
    "type": "memo",
    "time": "~12 min",
    "workstream": "attribution",
    "connectors": [
      "Salesforce",
      "HubSpot",
      "Outreach",
      "Gong"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 5 sections that answer the questions below. Build time on typical data: ~12 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~12 min covering 5 distinct sections. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Where did this specific deal come from, end-to-end?",
      "What were the inflection points that materially shaped this opportunity?",
      "How does credit allocate across channels under our canonical model for this deal?",
      "Which touches put this account on the radar before it became an opp?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot, Outreach, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 5 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Which opportunity: by Salesforce ID, opp name, or account name?",
      "Include sales activity overlay (calls, emails, meetings)?",
      "Audience tone: internal CRO/marketing leadership, or customer-facing?"
    ],
    "prompts": [
      "Run Deal Source Brief for the last quarter.",
      "Where did this specific deal come from, end-to-end?",
      "What were the inflection points that materially shaped this opportunity?",
      "How does credit allocate across channels under our canonical model for this deal?",
      "Which touches put this account on the radar before it became an opp?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "Outreach",
        "desc": "Sales engagement sequences, rep activity, response rates."
      },
      {
        "name": "Gong",
        "desc": "Conversation intelligence, call outcomes, and deal-risk signals."
      }
    ]
  },
  {
    "slug": "field-marketing-impact",
    "name": "Field Marketing Impact",
    "description": "Know whether the events you funded generated real pipeline and revenue, or just vanity leads that never converted.",
    "type": "dashboard",
    "time": "~8 min",
    "workstream": "attribution",
    "connectors": [
      "Salesforce",
      "HubSpot"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 4 widgets that answer the questions below. Build time on typical data: ~8 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~8 min covering 4 distinct widgets. Every value is source-linked back to 2 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which events drove qualified pipeline this quarter?",
      "What was the cost-per-pipeline-dollar by event tier?",
      "Did pipeline from events convert at the same rate as inbound?",
      "Which event types are repeat performers vs one-hit wonders?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 4 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Which event source: Splash, Bizzabo, manual list, all of them?",
      "Define an \"event-attributed\" opp: first-touch only, or any-touch?",
      "Time window: last quarter, year-to-date, or custom?"
    ],
    "prompts": [
      "Run Field Marketing Impact for the last quarter.",
      "Which events drove qualified pipeline this quarter?",
      "What was the cost-per-pipeline-dollar by event tier?",
      "Did pipeline from events convert at the same rate as inbound?",
      "Which event types are repeat performers vs one-hit wonders?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      }
    ]
  },
  {
    "slug": "full-funnel-journey-visibility",
    "name": "Full-Funnel Journey Visibility",
    "description": "See where the funnel is leaking volume or velocity, and exactly how far each stage sits from benchmark, across marketing and sales.",
    "type": "dashboard",
    "time": "~10 min",
    "workstream": "funnel",
    "connectors": [
      "Salesforce",
      "HubSpot"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 5 widgets that answer the questions below. Build time on typical data: ~10 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~10 min covering 5 distinct widgets. Every value is source-linked back to 2 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Where in the funnel is conversion under-performing benchmark?",
      "Where is velocity stretching out and slowing pipeline?",
      "How do this quarter's conversion rates compare to last?",
      "Which segments have the worst leakage at which stages?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 5 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Stages: full marketing → sales funnel or sales-only?",
      "Benchmark: internal trailing 4-quarter, or industry standard?",
      "Segment slice: by source, persona, or region?"
    ],
    "prompts": [
      "Run Full-Funnel Journey Visibility for the last quarter.",
      "Where in the funnel is conversion under-performing benchmark?",
      "Where is velocity stretching out and slowing pipeline?",
      "How do this quarter's conversion rates compare to last?",
      "Which segments have the worst leakage at which stages?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      }
    ]
  },
  {
    "slug": "funnel-conversion-rates",
    "name": "Funnel Conversion Rates",
    "description": "Track conversion rates across the full funnel (Lead through Closed Won) under cohort-consistent definitions. Replaces snapshot math that wobbles week-to-week with stable rates derived from completed cohort journeys.",
    "type": "dashboard",
    "time": "~9 min",
    "workstream": "funnel",
    "connectors": [
      "Salesforce",
      "HubSpot"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 7 widgets that answer the questions below. Build time on typical data: ~9 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~9 min covering 7 distinct widgets. Every value is source-linked back to 2 integrations and computed using your team's canonical definitions.",
    "questions": [
      "What's our full-funnel conversion rate from lead to closed-won?",
      "Where in the funnel is the worst drop-off?",
      "How are stage-pair rates trending over the last 12 months?",
      "Which segments convert at above-average rates?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 7 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Time period coverage: trailing 6 months, 12 months, or custom?",
      "Stage transitions to display: all seven, or focus on specific pairs?",
      "Lifecycle window per stage pair: tenant defaults or override?"
    ],
    "prompts": [
      "Run Funnel Conversion Rates for the last quarter.",
      "What's our full-funnel conversion rate from lead to closed-won?",
      "Where in the funnel is the worst drop-off?",
      "How are stage-pair rates trending over the last 12 months?",
      "Which segments convert at above-average rates?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      }
    ]
  },
  {
    "slug": "funnel-drop-diagnostic",
    "name": "Funnel Drop Diagnostic",
    "description": "Investigate why a funnel stage-pair conversion rate dropped. Runs a structured hypothesis tree against cohort composition, stage-entry quality, time-in-stage, and process changes; narrows to the most likely cause with confidence rating.",
    "type": "memo",
    "time": "~13 min",
    "workstream": "funnel",
    "connectors": [
      "Salesforce",
      "HubSpot"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 5 sections that answer the questions below. Build time on typical data: ~13 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~13 min covering 5 distinct sections. Every value is source-linked back to 2 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Why did this stage-pair conversion rate drop?",
      "Was it cohort composition, lead quality, time-in-stage, or process?",
      "How confident is the diagnosis, and what evidence supports it?",
      "Who should do what to recover, and what's the expected gap-closing impact?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 5 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Stage pair to investigate: auto-detect the largest recent drop, or specify?",
      "Drop window: most recent completed cohort vs prior 3 averaged, or custom?",
      "Hypothesis tree depth: 2, 3, or 4 levels?"
    ],
    "prompts": [
      "Run Funnel Drop Diagnostic for the last quarter.",
      "Why did this stage-pair conversion rate drop?",
      "Was it cohort composition, lead quality, time-in-stage, or process?",
      "How confident is the diagnosis, and what evidence supports it?",
      "Who should do what to recover, and what's the expected gap-closing impact?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      }
    ]
  },
  {
    "slug": "lead-scoring-dashboard",
    "name": "Lead Scoring Dashboard",
    "description": "Give SDRs a ranked work list today, and tell leadership whether the scoring model is actually predictive enough to trust.",
    "type": "dashboard",
    "time": "~9 min",
    "workstream": "funnel",
    "connectors": [
      "Salesforce",
      "HubSpot"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 5 widgets that answer the questions below. Build time on typical data: ~9 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~9 min covering 5 distinct widgets. Every value is source-linked back to 2 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which scored leads should each SDR work today?",
      "How predictive is the current scoring model on conversion?",
      "Where is the score over- or under-fitting?",
      "Which scoring features matter most for downstream outcomes?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 5 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Score source: Salesforce, HubSpot, or composite?",
      "Cohort window: last 30 or 90 days?",
      "Conversion definition: MQL → SQL or all the way to closed-won?"
    ],
    "prompts": [
      "Run Lead Scoring Dashboard for the last quarter.",
      "Which scored leads should each SDR work today?",
      "How predictive is the current scoring model on conversion?",
      "Where is the score over- or under-fitting?",
      "Which scoring features matter most for downstream outcomes?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      }
    ]
  },
  {
    "slug": "lead-source-effectiveness",
    "name": "Lead Source Effectiveness",
    "description": "Know which lead source produces qualified pipeline, not just lead volume, and which channels are expensive noise.",
    "type": "dashboard",
    "time": "~9 min",
    "workstream": "attribution",
    "connectors": [
      "Salesforce",
      "HubSpot"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 5 widgets that answer the questions below. Build time on typical data: ~9 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~9 min covering 5 distinct widgets. Every value is source-linked back to 2 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which lead sources convert MQL → SQL at above-average rates?",
      "Where is volume cheap but quality terrible?",
      "How do enterprise sources compare to mid-market on close rate?",
      "Which sources should we feed and which should we starve?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 5 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Source field: Salesforce Lead Source, HubSpot Original Source, or both?",
      "Quality threshold: MQL, SQL, or pipeline stage?",
      "Window: last 90 days or trailing 12 months?"
    ],
    "prompts": [
      "Run Lead Source Effectiveness for the last quarter.",
      "Which lead sources convert MQL → SQL at above-average rates?",
      "Where is volume cheap but quality terrible?",
      "How do enterprise sources compare to mid-market on close rate?",
      "Which sources should we feed and which should we starve?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      }
    ]
  },
  {
    "slug": "lead-source-hygiene-report",
    "name": "Lead Source Hygiene Report",
    "description": "Audit the data quality underlying every attribution number. Trust score, issue counts, top offenders, concrete examples, so you know exactly where the attribution layer is solid and where to invest in fixing.",
    "type": "dashboard",
    "time": "~8 min",
    "workstream": "attribution",
    "connectors": [
      "Salesforce",
      "HubSpot",
      "Google Ads",
      "LinkedIn Ads"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 5 widgets that answer the questions below. Build time on typical data: ~8 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~8 min covering 5 distinct widgets. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "How trustworthy is the attribution data we report on?",
      "Where are pixels failing or UTM tags inconsistent across campaigns?",
      "Where does identity stitching across CRM and MAP break?",
      "Which campaigns and owners are causing the most hygiene issues?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot, Google Ads, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 5 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Audit window: last 30, 60, or 90 days?",
      "Audit scope: comprehensive, or narrow to one category (UTM / lead source / stitching / mapping / source agreement)?",
      "Refresh schedule: weekly or monthly?"
    ],
    "prompts": [
      "Run Lead Source Hygiene Report for the last quarter.",
      "How trustworthy is the attribution data we report on?",
      "Where are pixels failing or UTM tags inconsistent across campaigns?",
      "Where does identity stitching across CRM and MAP break?",
      "Which campaigns and owners are causing the most hygiene issues?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "Google Ads",
        "desc": "Paid search spend, campaign performance, and conversions."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      }
    ]
  },
  {
    "slug": "lifecycle-stage-velocity",
    "name": "Lifecycle Stage Velocity",
    "description": "Track how long entities spend at each lifecycle stage and surface where velocity is slowing. Most funnel analysis ignores velocity. This skill makes it the headline.",
    "type": "dashboard",
    "time": "~10 min",
    "workstream": "funnel",
    "connectors": [
      "Salesforce",
      "HubSpot"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 8 widgets that answer the questions below. Build time on typical data: ~10 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~10 min covering 8 distinct widgets. Every value is source-linked back to 2 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Where in the funnel is velocity slowing systemically?",
      "Which stages have the longest median time-at-stage?",
      "How does velocity differ by segment and source?",
      "Which stages get skipped most often, and what does that imply?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 8 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Time period coverage: trailing 6 or 12 months of stage transitions?",
      "Cohort granularity for trend: weekly or monthly?",
      "Granularity of breakdown: org + segment, or include source?"
    ],
    "prompts": [
      "Run Lifecycle Stage Velocity for the last quarter.",
      "Where in the funnel is velocity slowing systemically?",
      "Which stages have the longest median time-at-stage?",
      "How does velocity differ by segment and source?",
      "Which stages get skipped most often, and what does that imply?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      }
    ]
  },
  {
    "slug": "lift-analysis",
    "name": "Lift Analysis",
    "description": "Know whether a campaign, sequence, or content push actually moved the needle above baseline, with statistical confidence, not gut feel.",
    "type": "memo",
    "time": "~14 min",
    "workstream": "attribution",
    "connectors": [
      "Salesforce",
      "HubSpot",
      "Google Ads",
      "LinkedIn Ads"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 6 sections that answer the questions below. Build time on typical data: ~14 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~14 min covering 6 distinct sections. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Did the campaign produce real lift, or were these conversions going to happen anyway?",
      "What's the holdout-vs-treated delta with confidence intervals?",
      "Which segments responded most strongly?",
      "How long should we run before we have a defensible read?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot, Google Ads, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 5 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Define the campaign or push: name, dates, audience selector?",
      "Holdout group: statistical match or random sample?",
      "Confidence threshold: 90%, 95%, or 99%?"
    ],
    "prompts": [
      "Run Lift Analysis for the last quarter.",
      "Did the campaign produce real lift, or were these conversions going to happen anyway?",
      "What's the holdout-vs-treated delta with confidence intervals?",
      "Which segments responded most strongly?",
      "How long should we run before we have a defensible read?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "Google Ads",
        "desc": "Paid search spend, campaign performance, and conversions."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      }
    ]
  },
  {
    "slug": "marketing-performance-review",
    "name": "Marketing Performance Review",
    "description": "Quarterly review of marketing's contribution to pipeline and revenue, written defensibly for CFO and CEO audiences. Replaces 2–3 days of manual board-prep work per cycle.",
    "type": "memo",
    "time": "~15 min",
    "workstream": "attribution",
    "connectors": [
      "Salesforce",
      "HubSpot",
      "Google Ads",
      "LinkedIn Ads",
      "Meta Ads"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 6 sections that answer the questions below. Build time on typical data: ~15 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~15 min covering 6 distinct sections. Every value is source-linked back to 5 integrations and computed using your team's canonical definitions.",
    "questions": [
      "What did marketing produce this quarter: pipeline, revenue, efficiency?",
      "Which channels grew, which declined, and by how much?",
      "Where should we scale spend next quarter, and where should we cut?",
      "What's the one-line summary I can defend in front of the CFO?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 4 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot, Google Ads, and 2 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 4 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 6 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Time window: last completed fiscal quarter, or custom?",
      "Comparison period: prior quarter, or year-ago quarter?",
      "Audience tone: financial (CFO-defensible) or operational (marketing-leadership)?",
      "Which metrics: sourced pipeline, sourced revenue, CAC, ROAS, channel breakdown (or all)?"
    ],
    "prompts": [
      "Run Marketing Performance Review for the last quarter.",
      "What did marketing produce this quarter: pipeline, revenue, efficiency?",
      "Which channels grew, which declined, and by how much?",
      "Where should we scale spend next quarter, and where should we cut?",
      "What's the one-line summary I can defend in front of the CFO?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "Google Ads",
        "desc": "Paid search spend, campaign performance, and conversions."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      },
      {
        "name": "Meta Ads",
        "desc": "Paid social on Facebook & Instagram: audience and creative performance."
      }
    ]
  },
  {
    "slug": "marketing-spend-dashboard",
    "name": "Marketing Spend Dashboard",
    "description": "Walk into the board meeting knowing exactly what you spent, what came back, what it cost to acquire, and whether efficiency is improving.",
    "type": "dashboard",
    "time": "~9 min",
    "workstream": "attribution",
    "connectors": [
      "Salesforce",
      "HubSpot",
      "Google Ads",
      "LinkedIn Ads",
      "Meta Ads"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 5 widgets that answer the questions below. Build time on typical data: ~9 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~9 min covering 5 distinct widgets. Every value is source-linked back to 5 integrations and computed using your team's canonical definitions.",
    "questions": [
      "What did we spend on marketing this quarter, and where did it go?",
      "How is CAC trending vs. payback period?",
      "Are paid efficiency curves bending the right way?",
      "Which spend categories should I cut first if we have to?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot, Google Ads, and 2 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 5 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Which spend categories: paid media only, or include people/events/tools?",
      "Define \"return\": pipeline, closed-won, or both side-by-side?",
      "Comparison window: QoQ, YoY, or rolling 4-quarter?"
    ],
    "prompts": [
      "Run Marketing Spend Dashboard for the last quarter.",
      "What did we spend on marketing this quarter, and where did it go?",
      "How is CAC trending vs. payback period?",
      "Are paid efficiency curves bending the right way?",
      "Which spend categories should I cut first if we have to?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "Google Ads",
        "desc": "Paid search spend, campaign performance, and conversions."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      },
      {
        "name": "Meta Ads",
        "desc": "Paid social on Facebook & Instagram: audience and creative performance."
      }
    ]
  },
  {
    "slug": "mql-sql-conversion-trend",
    "name": "MQL→SQL Conversion Trend",
    "description": "Cohort-consistent tracking of the marketing→sales handoff. Replaces fragile snapshot math (count MQLs / count SQLs in the same month) with stable, lag-aware cohort rates so the marketing-sales conversation stops devolving into \"whose number is right\".",
    "type": "dashboard",
    "time": "~8 min",
    "workstream": "funnel",
    "connectors": [
      "Salesforce",
      "HubSpot",
      "Outreach"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 7 widgets that answer the questions below. Build time on typical data: ~8 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~8 min covering 7 distinct widgets. Every value is source-linked back to 3 integrations and computed using your team's canonical definitions.",
    "questions": [
      "How is MQL→SQL converting cohort over cohort?",
      "How long does it typically take an MQL to become an SQL?",
      "Which sources and segments produce the highest-converting MQLs?",
      "Which SDRs convert their handed-off MQLs at above-team rate?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot, Outreach. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 7 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Time period coverage: trailing 6, 12, or 24 months?",
      "Cohort granularity: weekly, monthly, or daily?",
      "Lifecycle window: 30, 60, or 90 days?"
    ],
    "prompts": [
      "Run MQL→SQL Conversion Trend for the last quarter.",
      "How is MQL→SQL converting cohort over cohort?",
      "How long does it typically take an MQL to become an SQL?",
      "Which sources and segments produce the highest-converting MQLs?",
      "Which SDRs convert their handed-off MQLs at above-team rate?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "Outreach",
        "desc": "Sales engagement sequences, rep activity, response rates."
      }
    ]
  },
  {
    "slug": "multi-touch-revenue-attribution",
    "name": "Multi-Touch Revenue Attribution",
    "description": "Know which channels, campaigns, and touchpoints actually drive your pipeline and closed revenue, across five attribution models, all at once.",
    "type": "dashboard",
    "time": "~10 min",
    "workstream": "attribution",
    "connectors": [
      "Salesforce",
      "HubSpot",
      "Google Ads",
      "LinkedIn Ads",
      "Meta Ads",
      "GA4"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 5 widgets that answer the questions below. Build time on typical data: ~10 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~10 min covering 5 distinct widgets. Every value is source-linked back to 6 integrations and computed using your team's canonical definitions.",
    "questions": [
      "What percentage of closed revenue can we attribute to marketing?",
      "Which campaigns are generating pipeline but not closing, and why?",
      "How does last-touch credit shift under multi-touch models?",
      "If we cut one channel tomorrow, which would hurt least?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot, Google Ads, and 3 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 5 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Which models: first-touch, last-touch, linear, U-shaped, W-shaped (or all five)?",
      "What qualifies as a \"touch\": clicks, form fills, page visits?",
      "Minimum touch threshold per journey?"
    ],
    "prompts": [
      "Run Multi-Touch Revenue Attribution for the last quarter.",
      "What percentage of closed revenue can we attribute to marketing?",
      "Which campaigns are generating pipeline but not closing, and why?",
      "How does last-touch credit shift under multi-touch models?",
      "If we cut one channel tomorrow, which would hurt least?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "Google Ads",
        "desc": "Paid search spend, campaign performance, and conversions."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      },
      {
        "name": "Meta Ads",
        "desc": "Paid social on Facebook & Instagram: audience and creative performance."
      },
      {
        "name": "GA4",
        "desc": "Web analytics: content engagement and traffic sources."
      }
    ]
  },
  {
    "slug": "outbound-sequence-effectiveness",
    "name": "Outbound Sequence Effectiveness",
    "description": "Compare reply rates, meeting-booked rates, and downstream pipeline contribution per outbound sequence. Surface-metrics like reply rate are joined with outcome data so sequences get scaled or retired on actual pipeline contribution, not vanity engagement.",
    "type": "dashboard",
    "time": "~10 min",
    "workstream": "sales-activity",
    "connectors": [
      "Outreach",
      "Salesforce",
      "Gong"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 7 widgets that answer the questions below. Build time on typical data: ~10 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~10 min covering 7 distinct widgets. Every value is source-linked back to 3 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which sequences should we scale and which should we retire?",
      "Which sequence steps are doing the actual work?",
      "How do sequences perform across audience segments?",
      "Which recently-changed sequences improved or regressed?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Outreach, Salesforce, Gong. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 7 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Time window: trailing 60 or 90 days of completed enrollments?",
      "Conversion metric to optimize: meetings booked, replies, opportunities, or closed-won?",
      "Minimum enrollment threshold to include: 50, 100, or custom?"
    ],
    "prompts": [
      "Run Outbound Sequence Effectiveness for the last quarter.",
      "Which sequences should we scale and which should we retire?",
      "Which sequence steps are doing the actual work?",
      "How do sequences perform across audience segments?",
      "Which recently-changed sequences improved or regressed?"
    ],
    "integrations": [
      {
        "name": "Outreach",
        "desc": "Sales engagement sequences, rep activity, response rates."
      },
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "Gong",
        "desc": "Conversation intelligence, call outcomes, and deal-risk signals."
      }
    ]
  },
  {
    "slug": "pipeline-aging-report",
    "name": "Pipeline Aging Report",
    "description": "Surface stalled opportunities (open deals with no recent activity), sorted by value and prioritized for action. Removes the dead weight inflating coverage and skewing forecasts.",
    "type": "dashboard",
    "time": "~11 min",
    "workstream": "pipeline",
    "connectors": [
      "Salesforce",
      "Outreach",
      "Gong"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 7 widgets that answer the questions below. Build time on typical data: ~11 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~11 min covering 7 distinct widgets. Every value is source-linked back to 3 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which open deals have gone silent and need reviving or closing out?",
      "How much of our open pipeline is technically dead?",
      "Where is stalling concentrated: by stage, by owner, by segment?",
      "Which stalled deals have positive recent signals worth re-engaging on?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, Outreach, Gong. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 7 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Stalled threshold: 14, 21, or 30 days since last activity?",
      "Which stages to include: all open stages, or exclude Prospecting?",
      "Activity types that count: calls, emails, meetings, sequence steps, all?"
    ],
    "prompts": [
      "Run Pipeline Aging Report for the last quarter.",
      "Which open deals have gone silent and need reviving or closing out?",
      "How much of our open pipeline is technically dead?",
      "Where is stalling concentrated: by stage, by owner, by segment?",
      "Which stalled deals have positive recent signals worth re-engaging on?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "Outreach",
        "desc": "Sales engagement sequences, rep activity, response rates."
      },
      {
        "name": "Gong",
        "desc": "Conversation intelligence, call outcomes, and deal-risk signals."
      }
    ]
  },
  {
    "slug": "pipeline-coverage",
    "name": "Pipeline Coverage",
    "description": "Coverage ratio across the org, segments, and individual owners, under one governed definition that doesn't change between leadership asks. The single number every executive conversation starts with.",
    "type": "dashboard",
    "time": "~10 min",
    "workstream": "pipeline",
    "connectors": [
      "Salesforce"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 6 widgets that answer the questions below. Build time on typical data: ~10 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~10 min covering 6 distinct widgets. Every value is source-linked back to 1 integration and computed using your team's canonical definitions.",
    "questions": [
      "What's our coverage right now, against quota?",
      "Which segments and owners are below target?",
      "How has coverage trended over the past 12 weeks?",
      "Where in the funnel is the open pipeline concentrated?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 6 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Time horizon: current quarter, or rolling 90 days?",
      "Coverage target: 3.0x default, or tenant-configured override?",
      "Granularity: org-wide only, or include segment + owner breakdown?"
    ],
    "prompts": [
      "Run Pipeline Coverage for the last quarter.",
      "What's our coverage right now, against quota?",
      "Which segments and owners are below target?",
      "How has coverage trended over the past 12 weeks?",
      "Where in the funnel is the open pipeline concentrated?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      }
    ]
  },
  {
    "slug": "pipeline-coverage-gap-analysis",
    "name": "Pipeline Coverage Gap Analysis",
    "description": "Investigate why coverage is below target. Runs a structured hypothesis tree against pipeline, sourcing, and velocity data, narrows to the primary cause, and recommends remediation paths with confidence ratings.",
    "type": "memo",
    "time": "~13 min",
    "workstream": "pipeline",
    "connectors": [
      "Salesforce",
      "HubSpot"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 5 sections that answer the questions below. Build time on typical data: ~13 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~13 min covering 5 distinct sections. Every value is source-linked back to 2 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Why is coverage below target this quarter?",
      "Is the gap driven by sourcing, velocity, conversion, or compound across many?",
      "Which segments and stages contribute most to the shortfall?",
      "What specific actions could close the gap, and how much does each one estimate to recover?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 5 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Time horizon: current quarter, or next quarter forward look?",
      "Coverage target: tenant config, or override for this analysis?",
      "Hypothesis tree depth: 2, 3, or 4 levels?"
    ],
    "prompts": [
      "Run Pipeline Coverage Gap Analysis for the last quarter.",
      "Why is coverage below target this quarter?",
      "Is the gap driven by sourcing, velocity, conversion, or compound across many?",
      "Which segments and stages contribute most to the shortfall?",
      "What specific actions could close the gap, and how much does each one estimate to recover?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      }
    ]
  },
  {
    "slug": "pipeline-snapshot",
    "name": "Pipeline Snapshot",
    "description": "See whether this quarter's number is going to land, and exactly which deals carry the weight.",
    "type": "dashboard",
    "time": "~8 min",
    "workstream": "pipeline",
    "connectors": [
      "Salesforce",
      "HubSpot"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 4 widgets that answer the questions below. Build time on typical data: ~8 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~8 min covering 4 distinct widgets. Every value is source-linked back to 2 integrations and computed using your team's canonical definitions.",
    "questions": [
      "What's our committed vs. best-case vs. closed pipeline this quarter?",
      "Which deals are anchoring the forecast?",
      "How does coverage compare to the same point last quarter?",
      "Where do we stand against the 3x coverage rule?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 4 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Quarter scope: current, next, or rolling 90 days?",
      "Coverage target: 3x, 4x, or custom?",
      "Include closed-won YTD in coverage math?"
    ],
    "prompts": [
      "Run Pipeline Snapshot for the last quarter.",
      "What's our committed vs. best-case vs. closed pipeline this quarter?",
      "Which deals are anchoring the forecast?",
      "How does coverage compare to the same point last quarter?",
      "Where do we stand against the 3x coverage rule?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      }
    ]
  },
  {
    "slug": "quarterly-activity-review",
    "name": "Quarterly Activity Review",
    "description": "Quarterly review of sales team activity for sales-leadership audiences. Activity volume, mix, capacity utilization, top-performer patterns, structural learnings. Replaces the vague 'team is working hard' line in the QBR with a defensible narrative.",
    "type": "memo",
    "time": "~16 min",
    "workstream": "sales-activity",
    "connectors": [
      "Salesforce",
      "Outreach",
      "Gong"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 7 sections that answer the questions below. Build time on typical data: ~16 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~16 min covering 7 distinct sections. Every value is source-linked back to 3 integrations and computed using your team's canonical definitions.",
    "questions": [
      "What did sales actually do this quarter: volume, mix, capacity?",
      "Where is the team over- or under-utilized?",
      "What patterns distinguish the top quartile of reps?",
      "Which playbook or capacity changes should we make next quarter?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 4 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, Outreach, Gong. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 4 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 7 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Quarter to review: last completed, or custom?",
      "Comparison quarter: prior, or year-over-year?",
      "Audience tone: sales leadership (analytical) or board-ready (concise)?",
      "Include sequence-level analysis (if connected)?"
    ],
    "prompts": [
      "Run Quarterly Activity Review for the last quarter.",
      "What did sales actually do this quarter: volume, mix, capacity?",
      "Where is the team over- or under-utilized?",
      "What patterns distinguish the top quartile of reps?",
      "Which playbook or capacity changes should we make next quarter?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "Outreach",
        "desc": "Sales engagement sequences, rep activity, response rates."
      },
      {
        "name": "Gong",
        "desc": "Conversation intelligence, call outcomes, and deal-risk signals."
      }
    ]
  },
  {
    "slug": "quarterly-ad-performance-review",
    "name": "Quarterly Ad Performance Review",
    "description": "Comprehensive quarterly review of paid performance for marketing-leadership audiences. Replaces 1–2 days of compilation per cycle with a defensible memo grounded in governed definitions.",
    "type": "memo",
    "time": "~16 min",
    "workstream": "roas",
    "connectors": [
      "Salesforce",
      "Google Ads",
      "LinkedIn Ads",
      "Meta Ads"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 7 sections that answer the questions below. Build time on typical data: ~16 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~16 min covering 7 distinct sections. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "What did paid produce this quarter: spend, ROAS, pipeline, revenue?",
      "Which channels grew, which declined, and by how much?",
      "Where did efficiency improve or deteriorate?",
      "What changed structurally: channel adds, pauses, creative refreshes, and how did it land?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 4 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, Google Ads, LinkedIn Ads, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 4 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 7 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Which quarter: last completed, or custom?",
      "Comparison quarter: prior, or year-over-year?",
      "ROAS variant: pipeline or revenue?",
      "Audience tone: marketing leadership (detailed) or board-ready (concise)?"
    ],
    "prompts": [
      "Run Quarterly Ad Performance Review for the last quarter.",
      "What did paid produce this quarter: spend, ROAS, pipeline, revenue?",
      "Which channels grew, which declined, and by how much?",
      "Where did efficiency improve or deteriorate?",
      "What changed structurally: channel adds, pauses, creative refreshes, and how did it land?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "Google Ads",
        "desc": "Paid search spend, campaign performance, and conversions."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      },
      {
        "name": "Meta Ads",
        "desc": "Paid social on Facebook & Instagram: audience and creative performance."
      }
    ]
  },
  {
    "slug": "quarterly-funnel-review",
    "name": "Quarterly Funnel Review",
    "description": "Quarterly review of funnel performance for marketing and revenue leadership. Replaces 1–2 days of manual assembly with a structured, defensible memo grounded in governed cohort definitions.",
    "type": "memo",
    "time": "~16 min",
    "workstream": "funnel",
    "connectors": [
      "Salesforce",
      "HubSpot"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 7 sections that answer the questions below. Build time on typical data: ~16 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~16 min covering 7 distinct sections. Every value is source-linked back to 2 integrations and computed using your team's canonical definitions.",
    "questions": [
      "What did the funnel produce this quarter: leads, MQLs, SQLs, won deals?",
      "Where did conversion improve, and where did it decline?",
      "How did velocity shift across stages?",
      "What should leadership focus on next quarter?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 4 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 4 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 7 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Quarter to review: last completed, or custom?",
      "Comparison quarter: prior, or year-over-year?",
      "Audience tone: marketing/revenue leadership (detailed) or board-ready (concise)?",
      "Include rep/SDR-level detail: yes for internal, no for board?"
    ],
    "prompts": [
      "Run Quarterly Funnel Review for the last quarter.",
      "What did the funnel produce this quarter: leads, MQLs, SQLs, won deals?",
      "Where did conversion improve, and where did it decline?",
      "How did velocity shift across stages?",
      "What should leadership focus on next quarter?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      }
    ]
  },
  {
    "slug": "quarterly-pipeline-review",
    "name": "Quarterly Pipeline Review",
    "description": "Quarterly review of pipeline state, written for board and executive audiences. Bottom line first, supporting detail second. Replaces 1–2 days of RevOps board-prep per cycle.",
    "type": "memo",
    "time": "~16 min",
    "workstream": "pipeline",
    "connectors": [
      "Salesforce"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 6 sections that answer the questions below. Build time on typical data: ~16 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~16 min covering 6 distinct sections. Every value is source-linked back to 1 integration and computed using your team's canonical definitions.",
    "questions": [
      "What does open pipeline look like, and are we on track to land the number?",
      "What's the single most important risk to call out?",
      "Which large deals or segments shifted materially this quarter?",
      "What should leadership watch in the next quarter?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 4 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 4 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 6 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Quarter to review: current, or last completed (auto-detect if within 7 days of quarter close)?",
      "Comparison quarter: prior, or year-ago?",
      "Audience tone: board (concise, financial, risk-forward) or internal-leadership (more tactical)?",
      "Include rep-level detail: yes for internal-leadership, no for board?"
    ],
    "prompts": [
      "Run Quarterly Pipeline Review for the last quarter.",
      "What does open pipeline look like, and are we on track to land the number?",
      "What's the single most important risk to call out?",
      "Which large deals or segments shifted materially this quarter?",
      "What should leadership watch in the next quarter?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      }
    ]
  },
  {
    "slug": "rep-activity-mix",
    "name": "Rep Activity Mix",
    "description": "Per-rep activity volume and composition: calls, emails, meetings, sequence steps, social touches. Replaces Monday-morning squinting at Salesforce activity reports with structured rollups + outlier surfacing.",
    "type": "dashboard",
    "time": "~8 min",
    "workstream": "sales-activity",
    "connectors": [
      "Salesforce",
      "Outreach",
      "Gong"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 7 widgets that answer the questions below. Build time on typical data: ~8 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~8 min covering 7 distinct widgets. Every value is source-linked back to 3 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which reps changed their activity volume materially in the last 4 weeks?",
      "How is each rep splitting time across calls, emails, meetings, sequence steps?",
      "Which reps are heavy on email vs heavy on calls?",
      "Where are activity outliers concentrated by team?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, Outreach, Gong. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 7 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Time window: trailing 4 or 8 weeks?",
      "Rep roles: AEs, SDRs, or both?",
      "Activity types: full taxonomy or focused subset?"
    ],
    "prompts": [
      "Run Rep Activity Mix for the last quarter.",
      "Which reps changed their activity volume materially in the last 4 weeks?",
      "How is each rep splitting time across calls, emails, meetings, sequence steps?",
      "Which reps are heavy on email vs heavy on calls?",
      "Where are activity outliers concentrated by team?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "Outreach",
        "desc": "Sales engagement sequences, rep activity, response rates."
      },
      {
        "name": "Gong",
        "desc": "Conversation intelligence, call outcomes, and deal-risk signals."
      }
    ]
  },
  {
    "slug": "rep-performance-and-commission",
    "name": "Rep Performance & Commission",
    "description": "Know exactly what each AE earned this quarter, where their deals came from, and whether the attribution is clean enough to defend.",
    "type": "dashboard",
    "time": "~9 min",
    "workstream": "sales-activity",
    "connectors": [
      "Salesforce",
      "HubSpot"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 5 widgets that answer the questions below. Build time on typical data: ~9 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~9 min covering 5 distinct widgets. Every value is source-linked back to 2 integrations and computed using your team's canonical definitions.",
    "questions": [
      "How much did each AE earn this quarter, and from which deals?",
      "Where is commission attribution disputed or unclear?",
      "Which reps had inflated numbers from one big deal vs. consistent execution?",
      "How does this quarter compare to last on quota attainment?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 5 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Period: current quarter, last quarter, or YTD?",
      "Rep scope: full team or a single rep?",
      "Attribution rule: first-credit, last-credit, or split?"
    ],
    "prompts": [
      "Run Rep Performance & Commission for the last quarter.",
      "How much did each AE earn this quarter, and from which deals?",
      "Where is commission attribution disputed or unclear?",
      "Which reps had inflated numbers from one big deal vs. consistent execution?",
      "How does this quarter compare to last on quota attainment?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      }
    ]
  },
  {
    "slug": "rep-performance-scorecard",
    "name": "Rep Performance Scorecard",
    "description": "Know which AEs are on track, which need coaching, and exactly where the mismatch between activity and outcome is hiding.",
    "type": "dashboard",
    "time": "~9 min",
    "workstream": "sales-activity",
    "connectors": [
      "Salesforce",
      "Outreach",
      "Gong",
      "HubSpot"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 5 widgets that answer the questions below. Build time on typical data: ~9 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~9 min covering 5 distinct widgets. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which AEs are on track vs. behind for the quarter?",
      "Where is high activity not translating into outcomes?",
      "Where is low activity producing outsized results, and what are they doing?",
      "Which behaviors correlate with quota attainment?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, Outreach, Gong, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 5 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Performance period: current quarter or rolling 90 days?",
      "Activity sources: Outreach, Gong, Salesforce tasks?",
      "Outcome metric: pipeline created, closed-won, or both?"
    ],
    "prompts": [
      "Run Rep Performance Scorecard for the last quarter.",
      "Which AEs are on track vs. behind for the quarter?",
      "Where is high activity not translating into outcomes?",
      "Where is low activity producing outsized results, and what are they doing?",
      "Which behaviors correlate with quota attainment?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "Outreach",
        "desc": "Sales engagement sequences, rep activity, response rates."
      },
      {
        "name": "Gong",
        "desc": "Conversation intelligence, call outcomes, and deal-risk signals."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      }
    ]
  },
  {
    "slug": "roas-drop-analysis",
    "name": "ROAS Drop Analysis",
    "description": "Investigate why ROAS dropped. Runs a structured hypothesis tree against spend, attribution, creative, audience, and platform-cost data, narrows to the most likely cause, and recommends remediation paths.",
    "type": "memo",
    "time": "~12 min",
    "workstream": "roas",
    "connectors": [
      "Salesforce",
      "Google Ads",
      "LinkedIn Ads",
      "Meta Ads"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 5 sections that answer the questions below. Build time on typical data: ~12 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~12 min covering 5 distinct sections. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Why did ROAS drop this period?",
      "Was it creative fatigue, audience saturation, rising CPMs, or compound across many?",
      "How confident is the diagnosis, and what evidence supports it?",
      "What specific actions should we take: pause, refresh, shift, raise bids?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, Google Ads, LinkedIn Ads, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 5 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Drop window: last 7 days vs prior 7 days, or custom?",
      "Significance threshold: 10%, 15%, or 20% relative drop?",
      "ROAS variant: pipeline or revenue?"
    ],
    "prompts": [
      "Run ROAS Drop Analysis for the last quarter.",
      "Why did ROAS drop this period?",
      "Was it creative fatigue, audience saturation, rising CPMs, or compound across many?",
      "How confident is the diagnosis, and what evidence supports it?",
      "What specific actions should we take: pause, refresh, shift, raise bids?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "Google Ads",
        "desc": "Paid search spend, campaign performance, and conversions."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      },
      {
        "name": "Meta Ads",
        "desc": "Paid social on Facebook & Instagram: audience and creative performance."
      }
    ]
  },
  {
    "slug": "sales-velocity",
    "name": "Sales Velocity",
    "description": "Track how fast opportunities move through stages, across the org, segments, and individual reps. Bottlenecks get surfaced structurally, not by gut feel in quarterly post-mortems.",
    "type": "dashboard",
    "time": "~10 min",
    "workstream": "pipeline",
    "connectors": [
      "Salesforce",
      "Outreach"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 6 widgets that answer the questions below. Build time on typical data: ~10 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~10 min covering 6 distinct widgets. Every value is source-linked back to 2 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Where in the funnel are opportunities slowing down?",
      "How does this quarter's velocity compare to last quarter's?",
      "Which reps and segments are slowest at which stages?",
      "Is the bottleneck consistent or shifting period over period?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, Outreach. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 6 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Time window: last 90 days, last 180 days, or rolling 12 months?",
      "Velocity view: simple time-in-stage, or weighted-by-value?",
      "Stage scope: all qualified stages, or only post-MQL?"
    ],
    "prompts": [
      "Run Sales Velocity for the last quarter.",
      "Where in the funnel are opportunities slowing down?",
      "How does this quarter's velocity compare to last quarter's?",
      "Which reps and segments are slowest at which stages?",
      "Is the bottleneck consistent or shifting period over period?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "Outreach",
        "desc": "Sales engagement sequences, rep activity, response rates."
      }
    ]
  },
  {
    "slug": "sdr-capacity-utilization",
    "name": "SDR Capacity Utilization",
    "description": "Track how much of each SDR's working hours are accounted for by logged activity. Surfaces under-utilized SDRs (coverage capacity), over-utilized SDRs (burnout/quality risk), and pairs utilization with output to distinguish execution issues from healthy hustle.",
    "type": "dashboard",
    "time": "~10 min",
    "workstream": "sales-activity",
    "connectors": [
      "Salesforce",
      "Outreach",
      "Gong"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 7 widgets that answer the questions below. Build time on typical data: ~10 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~10 min covering 7 distinct widgets. Every value is source-linked back to 3 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Do we have enough SDR capacity for current lead volume?",
      "Which SDRs are at burnout-risk vs under-utilized?",
      "Which SDRs are highly utilized but low-output (execution issue)?",
      "How does utilization compare across teams?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, Outreach, Gong. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 7 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Time window: trailing 4 or 8 weeks?",
      "Working hours per SDR per week: 40, 35, or tenant-configured?",
      "Healthy utilization range: 40–80%, or override?"
    ],
    "prompts": [
      "Run SDR Capacity Utilization for the last quarter.",
      "Do we have enough SDR capacity for current lead volume?",
      "Which SDRs are at burnout-risk vs under-utilized?",
      "Which SDRs are highly utilized but low-output (execution issue)?",
      "How does utilization compare across teams?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "Outreach",
        "desc": "Sales engagement sequences, rep activity, response rates."
      },
      {
        "name": "Gong",
        "desc": "Conversation intelligence, call outcomes, and deal-risk signals."
      }
    ]
  },
  {
    "slug": "sdr-conversion-performance",
    "name": "SDR Conversion Performance",
    "description": "Per-SDR conversion rates, with lead-quality adjustment so the comparison is fair. Surfaces who needs coaching and what kind: execution, lead-quality, or capacity.",
    "type": "dashboard",
    "time": "~9 min",
    "workstream": "funnel",
    "connectors": [
      "Salesforce",
      "HubSpot",
      "Outreach"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 7 widgets that answer the questions below. Build time on typical data: ~9 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~9 min covering 7 distinct widgets. Every value is source-linked back to 3 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which SDRs are converting above and below team baseline?",
      "Whose underperformance is execution vs. lead-quality vs. capacity?",
      "How is each SDR's rate trending cohort over cohort?",
      "Which teams are outperforming on the same lead-quality mix?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot, Outreach. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 7 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Time period coverage: trailing 60, 90, or 180 days?",
      "Conversion metric: MQL→SQL only, or include MQL→Opportunity?",
      "Lead-quality adjustment: yes (recommended) or raw rates?"
    ],
    "prompts": [
      "Run SDR Conversion Performance for the last quarter.",
      "Which SDRs are converting above and below team baseline?",
      "Whose underperformance is execution vs. lead-quality vs. capacity?",
      "How is each SDR's rate trending cohort over cohort?",
      "Which teams are outperforming on the same lead-quality mix?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "Outreach",
        "desc": "Sales engagement sequences, rep activity, response rates."
      }
    ]
  },
  {
    "slug": "sdr-hit-list",
    "name": "SDR Hit List",
    "description": "Hand each SDR a ranked list of exactly which accounts to work this week, and why, with DM gaps and newly-activated accounts flagged.",
    "type": "dashboard",
    "time": "~8 min",
    "workstream": "sales-activity",
    "connectors": [
      "Salesforce",
      "6sense",
      "HubSpot",
      "Outreach"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 5 widgets that answer the questions below. Build time on typical data: ~8 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~8 min covering 5 distinct widgets. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which 30 accounts should this SDR contact this week?",
      "Where are decision-maker gaps that we should fill?",
      "Which accounts just activated and should get an early call?",
      "What's the last-touch state for each priority account?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, 6sense, HubSpot, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 5 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "SDR scope: single rep, pod, or all SDRs?",
      "List size: top 20, 30, or 50 per rep?",
      "Newly-activated threshold: last 7 or 14 days?"
    ],
    "prompts": [
      "Run SDR Hit List for the last quarter.",
      "Which 30 accounts should this SDR contact this week?",
      "Where are decision-maker gaps that we should fill?",
      "Which accounts just activated and should get an early call?",
      "What's the last-touch state for each priority account?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "6sense",
        "desc": "Third-party intent data and account-level surge signals."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "Outreach",
        "desc": "Sales engagement sequences, rep activity, response rates."
      }
    ]
  },
  {
    "slug": "source-of-pipeline",
    "name": "Source of Pipeline",
    "description": "Where pipeline comes from (marketing, sales, partner, expansion, other) under a governed source taxonomy. Replaces the ad-hoc reporting where every team's number disagrees with every other team's.",
    "type": "dashboard",
    "time": "~9 min",
    "workstream": "pipeline",
    "connectors": [
      "Salesforce",
      "HubSpot"
    ],
    "overview": "This Skill builds a dashboard grounded in your connected GTM data, with 5 widgets that answer the questions below. Build time on typical data: ~9 min.",
    "whatYoullGet": "Sage assembles a dashboard in roughly ~9 min covering 5 distinct widgets. Every value is source-linked back to 2 integrations and computed using your team's canonical definitions.",
    "questions": [
      "How is our pipeline mix split across marketing, sales, partner, and expansion?",
      "How has the mix shifted over the last 12 weeks?",
      "Which source category has the highest win rate and largest deals?",
      "Where do we suspect double-counting between marketing and sales?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a dashboard with 5 widgets (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Time window: trailing 12 weeks, or custom?",
      "Granularity: weekly, monthly, or quarterly buckets?",
      "Which source categories to display: all five, or a custom subset?"
    ],
    "prompts": [
      "Run Source of Pipeline for the last quarter.",
      "How is our pipeline mix split across marketing, sales, partner, and expansion?",
      "How has the mix shifted over the last 12 weeks?",
      "Which source category has the highest win rate and largest deals?",
      "Where do we suspect double-counting between marketing and sales?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      }
    ]
  },
  {
    "slug": "sourced-pipeline-diagnostic",
    "name": "Sourced Pipeline Diagnostic",
    "description": "Investigate why marketing-sourced pipeline dropped. Runs a structured hypothesis tree, narrows to the most likely cause with a confidence rating, and recommends specific actions.",
    "type": "memo",
    "time": "~13 min",
    "workstream": "attribution",
    "connectors": [
      "Salesforce",
      "HubSpot",
      "Google Ads",
      "LinkedIn Ads"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 5 sections that answer the questions below. Build time on typical data: ~13 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~13 min covering 5 distinct sections. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Why did marketing-sourced pipeline drop this period?",
      "Was the drop concentrated in one channel, one campaign, or compound across many?",
      "How confident is the diagnosis, and what evidence supports it?",
      "Which actions should we take to recover, and who should own each?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, HubSpot, Google Ads, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 5 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Drop window: current 7 days vs prior 7 days, or custom?",
      "Significance threshold to investigate: 10%, 15%, or 20% drop?",
      "Hypothesis tree depth: 2, 3, or 4 levels?"
    ],
    "prompts": [
      "Run Sourced Pipeline Diagnostic for the last quarter.",
      "Why did marketing-sourced pipeline drop this period?",
      "Was the drop concentrated in one channel, one campaign, or compound across many?",
      "How confident is the diagnosis, and what evidence supports it?",
      "Which actions should we take to recover, and who should own each?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "Google Ads",
        "desc": "Paid search spend, campaign performance, and conversions."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      }
    ]
  },
  {
    "slug": "spend-reallocation-plan",
    "name": "Spend Reallocation Plan",
    "description": "Recommend where to shift advertising spend to improve overall efficiency, with each recommendation backed by data and modeled impact. Replaces the gut-feel reallocation conversation every quarter.",
    "type": "memo",
    "time": "~13 min",
    "workstream": "roas",
    "connectors": [
      "Salesforce",
      "Google Ads",
      "LinkedIn Ads",
      "Meta Ads"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 5 sections that answer the questions below. Build time on typical data: ~13 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~13 min covering 5 distinct sections. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Where should the next $50K (or $X) of ad budget go?",
      "Which channels are over-funded relative to their efficient frontier?",
      "Where would a reallocation hurt least?",
      "What's the smallest reallocation that lifts blended ROAS by 0.5x?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 4 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, Google Ads, LinkedIn Ads, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 4 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 5 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Budget amount to reallocate: required (specify dollar amount)?",
      "Time window for performance analysis: trailing 60 days, or custom?",
      "Allow channel exclusions (hold or pause specific channels)?",
      "ROAS variant: pipeline or revenue?"
    ],
    "prompts": [
      "Run Spend Reallocation Plan for the last quarter.",
      "Where should the next $50K (or $X) of ad budget go?",
      "Which channels are over-funded relative to their efficient frontier?",
      "Where would a reallocation hurt least?",
      "What's the smallest reallocation that lifts blended ROAS by 0.5x?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "Google Ads",
        "desc": "Paid search spend, campaign performance, and conversions."
      },
      {
        "name": "LinkedIn Ads",
        "desc": "Paid social spend, impressions, clicks, lead-gen forms."
      },
      {
        "name": "Meta Ads",
        "desc": "Paid social on Facebook & Instagram: audience and creative performance."
      }
    ]
  },
  {
    "slug": "target-account-coverage-gap",
    "name": "Target Account Coverage Gap",
    "description": "Identifies target accounts that aren't being adequately covered (no engagement, no opportunities) and recommends reactivation actions categorized by root cause. Replaces the year-end discovery that a third of named accounts received zero touches.",
    "type": "memo",
    "time": "~13 min",
    "workstream": "abm",
    "connectors": [
      "Salesforce",
      "6sense",
      "HubSpot",
      "Outreach"
    ],
    "overview": "This Skill builds a memo grounded in your connected GTM data, with 5 sections that answer the questions below. Build time on typical data: ~13 min.",
    "whatYoullGet": "Sage assembles a memo in roughly ~13 min covering 5 distinct sections. Every value is source-linked back to 4 integrations and computed using your team's canonical definitions.",
    "questions": [
      "Which Tier 1 accounts have received zero outbound touches in the window?",
      "How does the gap break down by category (no coverage / light / cooled-out / buying-group gap)?",
      "Which root cause dominates: assignment, execution, or sustained-attention?",
      "What specific reactivation actions should we take, and on which accounts?"
    ],
    "beforeWeRun": "Sage proposes a complete plan and asks you to confirm 3 inputs before any query executes. Defaults are applied if you accept the plan as-is. You can override any of them or set the override as your new canonical.",
    "howItWorksLead": "A 4-step flow from your connected data to a verified, source-linked output.",
    "steps": [
      {
        "num": "01",
        "title": "Connect",
        "body": "Sage reads from your existing source systems: Salesforce, 6sense, HubSpot, and 1 more. No ETL, schema changes, or warehouse builds required. The data stays where it lives; Sage authenticates and queries it in place."
      },
      {
        "num": "02",
        "title": "Confirm",
        "body": "Sage proposes a plan and surfaces 3 inputs for you to confirm (listed under \"Inputs required\" below). You approve or modify the plan. Nothing executes until you sign off."
      },
      {
        "num": "03",
        "title": "Compute",
        "body": "Sage runs the SQL queries, joins, and Python transforms, applying your team's canonical KDs (Key Definitions): your ROAS formula, your attribution model, your stage definitions. Every metric uses your math, not a textbook default."
      },
      {
        "num": "04",
        "title": "Render",
        "body": "Output is generated as a memo with 5 sections (listed under \"Outputs generated\" below). Every number is source-linked. Click any value to see the SQL issued, the rows that contributed, and the formula applied."
      }
    ],
    "inputs": [
      "Account list: Tier 1, all named accounts, or custom?",
      "Analysis window: trailing 60, 90, or 180 days?",
      "Coverage gap threshold: fewer than 3, 5, or 10 buying-group signals?"
    ],
    "prompts": [
      "Run Target Account Coverage Gap for the last quarter.",
      "Which Tier 1 accounts have received zero outbound touches in the window?",
      "How does the gap break down by category (no coverage / light / cooled-out / buying-group gap)?",
      "Which root cause dominates: assignment, execution, or sustained-attention?",
      "What specific reactivation actions should we take, and on which accounts?"
    ],
    "integrations": [
      {
        "name": "Salesforce",
        "desc": "Pipeline, opportunities, accounts, contacts, and activities."
      },
      {
        "name": "6sense",
        "desc": "Third-party intent data and account-level surge signals."
      },
      {
        "name": "HubSpot",
        "desc": "Marketing automation: lead activity, contact engagement, email opens."
      },
      {
        "name": "Outreach",
        "desc": "Sales engagement sequences, rep activity, response rates."
      }
    ]
  }
];
