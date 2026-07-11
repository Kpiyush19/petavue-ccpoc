/**
 * Metrics data for the Definitions tab.
 * Each metric contains the raw formula and sources from the CSV.
 * Sources are parsed at render time by parseSourceColumns().
 */

export const METRICS_DATA = [
  {
    id: 1, name: 'Account Potential Analysis', status: 'enabled',
    description: 'List of accounts with average amount and probability to determine their potential',
    formula: '1. Filter salesforce_accounts for year 2024\n   - Filter records from salesforce_accounts where YEAR(salesforce_accounts_CreatedDate) = 2024\n2. Join salesforce_accounts with salesforce_opportunities\n   - Join salesforce_accounts and salesforce_opportunities where salesforce_accounts.salesforce_accounts_Id = salesforce_opportunities.salesforce_opportunities_AccountId\n3. Calculate average metrics per account\n   - Group the data by salesforce_accounts_Name\n   - For each account: Calculate average of salesforce_opportunities_Probability and Amount\n4. Sort results\n   - Sort the final dataset by average Amount in descending order',
    rawSources: 'salesforce_opportunities: Account ID[AccountId]; salesforce_opportunities: Amount[Amount]; salesforce_opportunities: Probability (%)[Probability]\nsalesforce_accounts: ID[Id]; salesforce_accounts: Name[Name]; salesforce_accounts: Created Date[CreatedDate]',
  },
  {
    id: 2, name: 'Accounts', status: 'disabled',
    description: 'List of all accounts',
    formula: '1. Get all records from salesforce_accounts table',
    rawSources: 'salesforce_accounts: ID[Id]',
  },
  {
    id: 3, name: 'Arr-booked2', status: 'enabled',
    description: 'Testing of metric creation gainsight',
    formula: '1. Join salesforce_accounts with itself to get parent account details:\n   - Left join salesforce_accounts (child) with salesforce_accounts (parent)\n   - Join condition: child.ParentId = parent.Id',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Name[Name]; salesforce_accounts: Parent Account ID[ParentId]',
  },
  {
    id: 4, name: 'At risk customers', status: 'disabled',
    description: 'Customers with health score < 50',
    formula: '1. Filter Customer Accounts:\n   - Filter records from salesforce_accounts table where Type = "Customer"\n2. Identify At-Risk Status:\n   - Identify accounts where Account_Health__c < 50\n3. Sort by Health Score:\n   - Sort results by Account_Health__c in ascending order',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Type[Type]; salesforce_accounts: Health Score[Account_Health__c]',
  },
  {
    id: 5, name: 'CTA engagement rate', status: 'enabled',
    description: 'CTA engagement rate evaluates how effectively experiences lead to CTA clicks. This is calculated by total CTA clicks by total experience.',
    formula: '1. Join Customer Data:\n   - Join salesforce_accounts with product_usage_extended where Type = "Customer"\n   - Join condition: salesforce_accounts.Id = product_usage_extended.Sfdc_Account_ID\n2. Calculate CTA Engagement Rate:\n   - Sum total CTA clicks from product_usage_extended.CTA_Clicks\n   - Sum total unique visitors from product_usage_extended.Unique_Visitors\n   - Calculate engagement rate = (Total CTA Clicks / Total Unique Visitors) * 100',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Type[Type]\nproduct_usage_extended: id[id]; product_usage_extended: SFDC Account ID[Sfdc_Account_ID]; product_usage_extended: CTA Clicks[CTA_Clicks]; product_usage_extended: Unique Visitors[Unique_Visitors]',
  },
  {
    id: 6, name: 'Churn rate', status: 'enabled',
    description: 'Customer churn rate',
    formula: '1. Filter Customer Base:\n   - Filter records where Type is either "Customer" or "Customer Attrited"\n2. Calculate Churn Components:\n   - Churned Customers: Count records where Type = "Customer Attrited"\n   - Total Customer Base: Count all records from step 1\n3. Calculate Churn Rate:\n   - (Count of "Customer Attrited" / Total Count) * 100',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Type[Type]',
  },
  {
    id: 7, name: 'Churned customers', status: 'disabled',
    description: 'List of all churned customers',
    formula: '1. Filter salesforce_accounts table to identify churned customers:\n   - Select records where Type = "Customer Attrited"',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Type[Type]',
  },
  {
    id: 8, name: 'Contacts', status: 'disabled',
    description: 'List of all contacts',
    formula: '1. Get all records from salesforce_contacts table',
    rawSources: 'salesforce_contacts: Contact ID[Id]; salesforce_contacts: First Name[FirstName]; salesforce_contacts: Email[Email]; salesforce_contacts: Account Name[Account_Name__c]; salesforce_contacts: MQL Date[MQL_Date__c]',
  },
  {
    id: 9, name: 'Customer Age', status: 'disabled',
    description: 'Average customer age.',
    formula: '1. Filter Customer Accounts:\n   - Filter accounts where Type = "Customer"\n2. Calculate Customer Age:\n   - Calculate age by finding the difference between current date and Customer_Start_Date__c in days\n3. Sort Results:\n   - Sort by Customer Age in descending order',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Type[Type]; salesforce_accounts: Customer Start Date[Customer_Start_Date__c]',
  },
  {
    id: 10, name: 'Customer Health Score', status: 'disabled',
    description: 'Customer health score shows how much customers are healthy based on their usage. The score ranges from 0 to 100.',
    formula: '1. Filter Customer Accounts:\n   - Filter accounts where Type = "Customer"\n2. Join Customer Data with Product Usage:\n   - Left join between salesforce_accounts and product_usage_extended on Id = Sfdc_Account_ID\n3. Calculate Individual Component Scores:\n   - Pulse Score, License Utilisation Score, Content Activation Change Score, Account Engagement Score, Feature Usage Score, Visitor Score\n4. Calculate Final Health Score:\n   - Sum all component scores / 60 * 100',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Type[Type]; salesforce_accounts: Category[Account_Category__c]; salesforce_accounts: Customer Start Date[Customer_Start_Date__c]; salesforce_accounts: Pulse[Pulse__c]; salesforce_accounts: Engagement Level (People.ai)[peopleai__EngagementLevel__c]; salesforce_accounts: PX Content Activation Usage Last 30[PX_Feature_Usage_Change_in_30_days__c]; salesforce_accounts: PX Content Activation % Change Last 30[PX_Content_Activation_Change_Last_30__c]; salesforce_accounts: Utilization Last 30 days[License_Utilization_Last_30_days__c]\nproduct_usage_extended: SFDC Account ID[Sfdc_Account_ID]; product_usage_extended: Unique Visitors[Unique_Visitors]',
  },
  {
    id: 11, name: 'Customer Lifetime Value (CLV)', status: 'enabled',
    description: 'Customer Lifetime Value (CLV)',
    formula: '1. Calculate Average Revenue Per Account:\n   - Sum ARR__c from salesforce_accounts, divide by unique account count\n2. Calculate Retention Period:\n   - When Contract End Date exists: (Contract_End_Date__c - Customer_Start_Date__c) in years\n   - When missing: (Current Date - Customer_Start_Date__c) in years\n3. Calculate CLV:\n   - Average Revenue Per Account * Average Retention Period',
    rawSources: 'salesforce_opportunities: Close Date[CloseDate]; salesforce_opportunities: Contract End Date[Contract_End_Date__c]; salesforce_opportunities: Contract Start Date[Contract_Start_Date__c]\nsalesforce_accounts: ID[Id]; salesforce_accounts: Contract Start Date[Contract_Start_Date__c]; salesforce_accounts: Contract End Date[Contract_End_Date__c]; salesforce_accounts: ARR[ARR__c]; salesforce_accounts: Customer Start Date[Customer_Start_Date__c]',
  },
  {
    id: 12, name: 'Customer pulse score', status: 'disabled',
    description: '',
    formula: '1. Join salesforce_accounts with product_usage_extended:\n   - Join condition: Id = Sfdc_Account_ID\n2. Filter Customer Accounts:\n   - Include only accounts where Type = "Customer"\n3. Calculate Pulse Score:\n   - Very Satisfied = 10, Fairly Satisfied = 5, Some Risk = 10, Others = 0',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Type[Type]; salesforce_accounts: Pulse[Pulse__c]\nproduct_usage_extended: SFDC Account ID[Sfdc_Account_ID]; product_usage_extended: Unique Visitors[Unique_Visitors]',
  },
  {
    id: 13, name: 'Customer usage summary', status: 'enabled',
    description: 'List of all customers with their usage metrics',
    formula: '1. Filter Customer Accounts:\n   - Filter salesforce_accounts where Type = "Customer"\n2. Join with Product Usage:\n   - LEFT JOIN with product_usage_extended on Id = Sfdc_Account_ID\n3. Calculate Unique Visitor Rate:\n   - (Unique_Visitors / (Known_Visitors + Unknown_Visitors)) * 100',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Type[Type]; salesforce_accounts: Utilization Last 30 days[License_Utilization_Last_30_days__c]\nproduct_usage_extended: CTA Clicks[CTA_Clicks]; product_usage_extended: SFDC Account ID[Sfdc_Account_ID]; product_usage_extended: Unique Visitors[Unique_Visitors]; product_usage_extended: Known Visitors[Known_Visitors]; product_usage_extended: Unknown Visitors[Unknown_Visitors]',
  },
  {
    id: 14, name: 'Customers', status: 'enabled',
    description: 'List of all active customers',
    formula: '1. Filter accounts where Type = "Customer"\n2. Sort by Name in ascending order',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Name[Name]; salesforce_accounts: Type[Type]',
  },
  {
    id: 15, name: 'Deal Size', status: 'enabled',
    description: 'Deal Size refers to the monetary value or size of an individual sales transaction.',
    formula: '1. Filter salesforce_opportunities:\n   - Include opportunities where ARR < 100000\n2. Join Data Tables:\n   - Join with salesforce_contacts on ContactId\n   - Join with salesforce_accounts on AccountId\n3. Sort by ARR__c descending',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Amount[Amount]; salesforce_opportunities: Close Date[CloseDate]; salesforce_opportunities: Contact ID[ContactId]; salesforce_opportunities: Current ARR[ARR__c]\nsalesforce_accounts: ID[Id]\nsalesforce_contacts: Contact ID[Id]; salesforce_contacts: Account ID[AccountId]',
  },
  {
    id: 16, name: 'Deal Velocity', status: 'disabled',
    description: 'Deal velocity',
    formula: '1. Filter Closed Won Opportunities:\n   - Filter where IsClosed = 1 AND IsWon = 1\n2. Calculate Deal Velocity Components:\n   - Converted Opportunities count, Average Contract Value, Rate of Closure, Sales Cycle Length\n3. Calculate: (Converted Opps * Avg Value * Rate of Closure) / Avg Sales Cycle Length',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Amount[Amount]; salesforce_opportunities: Close Date[CloseDate]; salesforce_opportunities: Closed[IsClosed]; salesforce_opportunities: Won[IsWon]; salesforce_opportunities: Created Date[CreatedDate]',
  },
  {
    id: 17, name: 'Engagement Efficiency Rate', status: 'enabled',
    description: 'Engagement Efficiency Rate captures the average number of actions per experience.',
    formula: '1. Filter Customer Accounts:\n   - Filter salesforce_accounts where Type = "Customer"\n2. Join with product_usage_extended on Id = Sfdc_Account_ID\n3. Calculate Engagement Metrics:\n   - Total_CTA_Clicks, Total_Form_Fills, Total_Experiences\n4. Rate = ((CTA_Clicks + Form_Fills) / Experiences) * 100',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Type[Type]\nproduct_usage_extended: SFDC Account ID[Sfdc_Account_ID]; product_usage_extended: CTA Clicks[CTA_Clicks]; product_usage_extended: Form Fills[Form_Fills]; product_usage_extended: Unique Visitors[Unique_Visitors]',
  },
  {
    id: 18, name: 'Fastest-Converting Deals', status: 'enabled',
    description: 'List opportunities with the shortest time to closure.',
    formula: '1. Calculate Time to Closure:\n   - Difference between CloseDate and CreatedDate in days\n2. Filter Closed Opportunities:\n   - Filter where IsClosed = 1\n   - Sort by time_to_closure ascending',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Close Date[CloseDate]; salesforce_opportunities: Closed[IsClosed]; salesforce_opportunities: Created Date[CreatedDate]',
  },
  {
    id: 19, name: 'Form conversion rate', status: 'disabled',
    description: 'Form conversion rate',
    formula: '1. Calculate Form Metrics:\n   - Get total forms count from marketo_form table\n   - Get unique submissions by counting distinct lead_id\n   - Form conversion rate = (unique submissions / total forms) * 100',
    rawSources: 'marketo_activity_fill_out_form: Id[id]; marketo_activity_fill_out_form: Lead id[lead_id]; marketo_activity_fill_out_form: Activity date[activity_date]',
  },
  {
    id: 20, name: 'Form fill rate', status: 'enabled',
    description: 'Assesses the effectiveness of experiences in generating form fills.',
    formula: '1. Filter Customer Accounts where Type = "Customer"\n2. LEFT JOIN with product_usage_extended on Id = Sfdc_Account_ID\n3. Form Fill Rate = (Total Form Fills / Total Unique Visitors) * 100',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Type[Type]\nproduct_usage_extended: id[id]; product_usage_extended: SFDC Account ID[Sfdc_Account_ID]; product_usage_extended: Form Fills[Form_Fills]; product_usage_extended: Unique Visitors[Unique_Visitors]',
  },
  {
    id: 21, name: 'Form submission rate', status: 'disabled',
    description: 'Form submission rate',
    formula: '1. Count total form submissions from marketo_activity_fill_out_form\n2. Count total forms from marketo_form\n3. Rate = (total_submissions / total_forms) * 100',
    rawSources: 'marketo_activity_fill_out_form: Id[id]',
  },
  {
    id: 22, name: 'Lead Drop-Off Analysis', status: 'enabled',
    description: 'Analyze the stages where most leads are dropped or disqualified.',
    formula: '1. Lead Disqualification Analysis:\n   - Filter leads where Status = "Disqualified", group by Record_Type__c\n2. Lead Drop-off Rate:\n   - (1 - (converted leads / total leads)) * 100\n3. Opportunity Stage Analysis:\n   - Group opportunities by StageName\n4. Qualified Out Analysis:\n   - Filter where Qualified_Out__c = 1, group by reason\n5. Lost Opportunity Analysis:\n   - Filter where Lost__c = 1, group by reason\n6. Conversion Rate: (Closed Won / SQL opportunities) * 100',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Closed[IsClosed]; salesforce_opportunities: Won[IsWon]; salesforce_opportunities: SQL Date[SQL_Date__c]; salesforce_opportunities: Qualified Out[Qualified_Out__c]; salesforce_opportunities: Lost[Lost__c]\nsalesforce_leads: ID[Id]; salesforce_leads: Status[Status]; salesforce_leads: Converted[IsConverted]; salesforce_leads: Converted Date[ConvertedDate]',
  },
  {
    id: 23, name: 'Lead to MQL conversion rate', status: 'enabled',
    description: 'Conversion rate of a lead to MQL',
    formula: '1. Get Total Leads Count from salesforce_leads\n2. Join salesforce_leads with salesforce_contacts on ConvertedContactId\n   - Filter: IsConverted = 1 and MQL_Date__c is not null\n3. Rate = (MQL Converted Leads / Total Leads) * 100',
    rawSources: 'salesforce_contacts: Contact ID[Id]; salesforce_contacts: MQL Date[MQL_Date__c]\nsalesforce_leads: ID[Id]; salesforce_leads: Converted[IsConverted]; salesforce_leads: Converted Contact ID[ConvertedContactId]',
  },
  {
    id: 24, name: 'Leads', status: 'enabled',
    description: 'List of all leads',
    formula: '1. Get all records from salesforce_leads table\n2. Sort by CreatedDate descending',
    rawSources: 'salesforce_leads: ID[Id]; salesforce_leads: Created Date[CreatedDate]',
  },
  {
    id: 25, name: 'Lifecycle Compression Metrics', status: 'enabled',
    description: 'Measure how effective the team is at compressing lifecycle stages for deals.',
    formula: '1. Merge salesforce_opportunities with salesforce_users on OwnerId, then with salesforce_accounts on AccountId\n2. Filter closed opportunities, calculate Pipeline Duration, Final Stage Velocity, Time Saved\n3. Analyze Compression Rates by Team Member and Account Type\n4. Time Trend Analysis by year and month',
    rawSources: 'salesforce_users: User ID[Id]\nsalesforce_opportunities: ID[Id]; salesforce_opportunities: Account ID[AccountId]; salesforce_opportunities: Close Date[CloseDate]; salesforce_opportunities: Closed[IsClosed]; salesforce_opportunities: Owner ID[OwnerId]; salesforce_opportunities: Created Date[CreatedDate]; salesforce_opportunities: Last Stage Change Date[LastStageChangeDate]\nsalesforce_accounts: ID[Id]',
  },
  {
    id: 26, name: 'Lost opportunities', status: 'enabled',
    description: 'List of all lost opportunities',
    formula: '1. Filter where IsClosed = 1 AND IsWon = 0',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Closed[IsClosed]; salesforce_opportunities: Won[IsWon]',
  },
  {
    id: 27, name: 'MQL to SQL conversion rate', status: 'enabled',
    description: 'Conversion rate of MQL contacts to SQL opportunities',
    formula: '1. Join salesforce_opportunities with salesforce_accounts and salesforce_contacts\n2. Count distinct contacts where MQL_Date__c is not null\n3. Count distinct opportunities where SQL_Date__c is not null and MQL_Date__c is not null\n4. Rate = (SQL Opportunities / Total MQLs) * 100',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Account ID[AccountId]; salesforce_opportunities: Contact ID[ContactId]; salesforce_opportunities: SQL Date[SQL_Date__c]\nsalesforce_accounts: ID[Id]\nsalesforce_contacts: Contact ID[Id]; salesforce_contacts: MQL Date[MQL_Date__c]',
  },
  {
    id: 28, name: 'MQL to SQL conversion time(in days)', status: 'enabled',
    description: 'Average days required to move an MQL contact to an SQL opportunity',
    formula: '1. Join salesforce_opportunities with salesforce_accounts and salesforce_contacts\n2. Filter where SQL_Date__c and MQL_Date__c are not null\n3. Find earliest MQL_Date__c per opportunity\n4. Calculate days between SQL_Date__c and earliest MQL_Date__c\n5. Return the average',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Account ID[AccountId]; salesforce_opportunities: Contact ID[ContactId]; salesforce_opportunities: SQL Date[SQL_Date__c]\nsalesforce_accounts: ID[Id]\nsalesforce_contacts: Contact ID[Id]; salesforce_contacts: MQL Date[MQL_Date__c]',
  },
  {
    id: 29, name: 'MQLs Assigned to Sales Reps but No Follow-Up in 48 Hours', status: 'enabled',
    description: 'Sales reps often miss following up on MQLs assigned to them within the first 48 hours, which can lead to lost opportunities.',
    formula: '1. Filter MQLs from marketo_lead where mql_date_c is not null and owner_type_c = "Sales"\n2. Join marketo_lead with salesforce_accounts and salesforce_tasks\n3. Identify leads with no follow-up task or follow-up > 48 hours after MQL date',
    rawSources: 'marketo_lead: Id[id]; marketo_lead: Owner type[owner_type_c]; marketo_lead: Mql date[mql_date_c]; marketo_lead: Sfdc account id[sfdc_account_id]\nsalesforce_accounts: ID[Id]\nsalesforce_tasks: Account ID[AccountId]; salesforce_tasks: Created Date[CreatedDate]',
  },
  {
    id: 30, name: 'Marketing Qualified Leads', status: 'enabled',
    description: 'List of all Marketing Qualified leads',
    formula: '1. Filter contacts from salesforce_contacts where MQL_Date__c is not null',
    rawSources: 'salesforce_contacts: Contact ID[Id]; salesforce_contacts: MQL Date[MQL_Date__c]',
  },
  {
    id: 31, name: 'New customers', status: 'disabled',
    description: 'List of all customers closed in last 6 months',
    formula: '1. Filter where Type = "Customer"\n2. Filter where Customer_Start_Date__c >= Current_Date - 6 months\n3. Sort by Customer_Start_Date__c descending',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Type[Type]; salesforce_accounts: Customer Start Date[Customer_Start_Date__c]',
  },
  {
    id: 32, name: 'Open opportunities', status: 'enabled',
    description: 'List of all opportunities that are not closed',
    formula: '1. Filter where IsClosed = 0',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Close Date[CloseDate]; salesforce_opportunities: Closed[IsClosed]',
  },
  {
    id: 33, name: 'Opportunities', status: 'disabled',
    description: 'List of all opportunities',
    formula: '1. Get all records from salesforce_opportunities table',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Amount[Amount]; salesforce_opportunities: Close Date[CloseDate]; salesforce_opportunities: Closed[IsClosed]; salesforce_opportunities: Won[IsWon]; salesforce_opportunities: Fiscal Quarter[FiscalQuarter]; salesforce_opportunities: Fiscal Year[FiscalYear]',
  },
  {
    id: 34, name: 'Opportunities Progressing through the sales pipeline', status: 'enabled',
    description: 'Opportunities are progressing through the sales pipeline.',
    formula: '1. Filter Closed Opportunities where IsClosed = 1\n2. Calculate Pipeline Duration, Stage Change Analysis, Stage-wise Duration\n3. Analyze CFCR Velocity for Won Opportunities\n4. Group Analysis by Opportunity Type\n5. Temporal Analysis by Year and Month',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Close Date[CloseDate]; salesforce_opportunities: Closed[IsClosed]; salesforce_opportunities: Created Date[CreatedDate]; salesforce_opportunities: Last Stage Change Date[LastStageChangeDate]',
  },
  {
    id: 35, name: 'Opportunity conversion rate', status: 'enabled',
    description: 'Percentage of sales opportunities that are successfully closed as wins.',
    formula: '1. Count closed and won opportunities (IsClosed = 1 AND IsWon = 1)\n2. Count total opportunities\n3. Rate = (Closed Won / Total) * 100',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Closed[IsClosed]; salesforce_opportunities: Won[IsWon]',
  },
  {
    id: 36, name: 'Opportunity loss rate', status: 'enabled',
    description: 'Percentage of sales opportunities that are marked as lost.',
    formula: '1. Filter where IsClosed = 1 and IsWon = 0\n2. Count lost opportunities\n3. Rate = (Lost / Total) * 100',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Closed[IsClosed]; salesforce_opportunities: Won[IsWon]',
  },
  {
    id: 37, name: 'Pipeline closed', status: 'enabled',
    description: 'The sum of ARR of closed won opportunities',
    formula: '1. Filter where IsClosed = 1 and IsWon = 1\n2. Sum ARR__c from filtered opportunities',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Closed[IsClosed]; salesforce_opportunities: Won[IsWon]; salesforce_opportunities: Current ARR[ARR__c]',
  },
  {
    id: 38, name: 'Pipeline conversion efficiency', status: 'enabled',
    description: 'Measures how effectively leads move through the pipeline from MQLs to closed-won deals.',
    formula: '1. Join salesforce_opportunities with salesforce_accounts and salesforce_contacts\n2. Calculate Total MQLs (MQL_Date__c not null)\n3. Calculate Total SQL Opportunities\n4. Calculate Closed Won SQL Opportunities\n5. Efficiency = (Closed Won SQL / Total MQLs) * 100',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Account ID[AccountId]; salesforce_opportunities: Closed[IsClosed]; salesforce_opportunities: Won[IsWon]; salesforce_opportunities: Contact ID[ContactId]; salesforce_opportunities: SQL Date[SQL_Date__c]\nsalesforce_accounts: ID[Id]\nsalesforce_contacts: Contact ID[Id]; salesforce_contacts: MQL Date[MQL_Date__c]',
  },
  {
    id: 39, name: 'Pipeline fallout', status: 'enabled',
    description: 'The sum of Amount of lost opportunities',
    formula: '1. Filter where IsClosed = 1 AND IsWon = 0\n2. Count lost opportunities and sum Amount',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Amount[Amount]; salesforce_opportunities: Closed[IsClosed]; salesforce_opportunities: Won[IsWon]',
  },
  {
    id: 40, name: 'Pipeline generated', status: 'enabled',
    description: 'The sum of Amount of opportunities created',
    formula: '1. Calculate total unique opportunities count\n2. Sum Amount for all opportunities',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Amount[Amount]; salesforce_opportunities: Created Date[CreatedDate]',
  },
  {
    id: 41, name: 'Prospect', status: 'enabled',
    description: 'List of all prospects',
    formula: '1. Filter salesforce_accounts where Type = "Prospect"',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Type[Type]',
  },
  {
    id: 42, name: 'SQL', status: 'enabled',
    description: 'List of all Sales Qualified Opportunities',
    formula: '1. Filter where SQL_Date__c is not null\n2. LEFT JOIN with salesforce_accounts on AccountId\n3. LEFT JOIN with salesforce_contacts on ContactId\n4. Filter contacts with MQL_Date__c not null\n5. Remove duplicate opportunities',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Account ID[AccountId]; salesforce_opportunities: Contact ID[ContactId]; salesforce_opportunities: SQL Date[SQL_Date__c]\nsalesforce_accounts: ID[Id]\nsalesforce_contacts: Contact ID[Id]; salesforce_contacts: MQL Date[MQL_Date__c]',
  },
  {
    id: 43, name: 'Sales Cycle Length', status: 'enabled',
    description: 'Difference between the account created date and opportunity close date',
    formula: '1. Filter Won Opportunities (IsClosed = 1, IsWon = 1)\n2. Filter Q1 2024 (CloseDate between Jan 1 and Mar 31, 2024)\n3. Join with salesforce_accounts on AccountId\n4. Calculate Sales Cycle Length = CloseDate - Account CreatedDate',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Account ID[AccountId]; salesforce_opportunities: Close Date[CloseDate]; salesforce_opportunities: Closed[IsClosed]; salesforce_opportunities: Won[IsWon]\nsalesforce_accounts: ID[Id]; salesforce_accounts: Created Date[CreatedDate]',
  },
  {
    id: 44, name: 'Stuck opportunities', status: 'enabled',
    description: 'List of all open opportunities that have pushed closed date more than two.',
    formula: '1. Filter where IsClosed = 0\n2. Filter where PushCount > 2\n3. Sort by PushCount descending',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Closed[IsClosed]; salesforce_opportunities: Push Count[PushCount]',
  },
  {
    id: 45, name: 'Time for MQL to SQL conversion', status: 'disabled',
    description: 'Average time required to converted an MQL to SQL',
    formula: '1. Join salesforce_opportunities with salesforce_contacts on ContactId\n2. Filter where SQL_Date__c and MQL_Date__c are not null and SQL >= MQL\n3. Calculate days between SQL_Date__c and MQL_Date__c\n4. Return the average',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Contact ID[ContactId]; salesforce_opportunities: SQL Date[SQL_Date__c]\nsalesforce_contacts: Contact ID[Id]; salesforce_contacts: MQL Date[MQL_Date__c]',
  },
  {
    id: 46, name: 'Upcoming renewal accounts in 3 months', status: 'enabled',
    description: 'Upcoming renewal accounts in next 3 months',
    formula: '1. Filter where X3_Month_Renewal_Check__c = 1\n2. Sort by Name ascending',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Name[Name]; salesforce_accounts: 3-Month Renewal Check[X3_Month_Renewal_Check__c]',
  },
  {
    id: 47, name: 'Upcoming renewal customers', status: 'disabled',
    description: 'Customers having renewal date in next 100 days',
    formula: '1. Filter where Type = "Customer"\n2. Filter where Next_Renewal_Date__c is between current_date and current_date + 100 days\n3. Sort by Next_Renewal_Date__c ascending',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Type[Type]; salesforce_accounts: Next Renewal Date[Next_Renewal_Date__c]',
  },
  {
    id: 48, name: 'Visitor return rate', status: 'enabled',
    description: 'The percentage of returning visitors out of the total visitors.',
    formula: '1. Sum Known_Visitors and Unknown_Visitors\n2. Rate = (Known_Visitors / (Known_Visitors + Unknown_Visitors)) * 100',
    rawSources: 'product_usage_extended: id[id]; product_usage_extended: Known Visitors[Known_Visitors]; product_usage_extended: Unknown Visitors[Unknown_Visitors]',
  },
  {
    id: 49, name: 'Weighted Pipeline Value', status: 'enabled',
    description: 'Weighted Pipeline Value.',
    formula: '1. Map Stage Names to Probability Values\n2. Calculate Weighted_Amount = Amount * Probability for each opportunity',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Stage[StageName]; salesforce_opportunities: Amount[Amount]',
  },
  {
    id: 50, name: 'Won opportunities', status: 'enabled',
    description: 'List of all closed won opportunities',
    formula: '1. Filter where IsClosed = 1 AND IsWon = 1',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Closed[IsClosed]; salesforce_opportunities: Won[IsWon]',
  },
  {
    id: 51, name: 'accounts2', status: 'enabled',
    description: 'Account details with parent name',
    formula: '1. Self-join salesforce_accounts using LEFT JOIN\n   - Join condition: child.ParentId = parent.Id',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Parent Account ID[ParentId]',
  },
  {
    id: 52, name: 'accounts_testing', status: 'enabled',
    description: 'Account details with parent name',
    formula: '1. Self-join salesforce_accounts using LEFT JOIN\n   - Join condition: child.ParentId = parent.Id',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Parent Account ID[ParentId]',
  },
  {
    id: 53, name: 'closed_opportunities', status: 'enabled',
    description: 'List of closed opportunities',
    formula: '1. Filter where IsClosed = 1',
    rawSources: 'salesforce_opportunities: ID[Id]; salesforce_opportunities: Close Date[CloseDate]; salesforce_opportunities: Closed[IsClosed]',
  },
  {
    id: 54, name: 'customer', status: 'enabled',
    description: 'Customers',
    formula: '1. Filter where Type = "Customer"\n2. Sort by Name ascending',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Name[Name]; salesforce_accounts: Type[Type]; salesforce_accounts: Contract Start Date[Contract_Start_Date__c]; salesforce_accounts: Contract End Date[Contract_End_Date__c]; salesforce_accounts: Customer Start Date[Customer_Start_Date__c]',
  },
  {
    id: 55, name: 'customers_testing', status: 'enabled',
    description: 'Customers grouped by account category',
    formula: '1. Filter where Type = "Customer"\n2. Group by Account_Category__c\n3. Count customers per category\n4. Sort by count descending',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Type[Type]',
  },
  {
    id: 56, name: 'customers_testing1', status: 'enabled',
    description: 'Customers grouped by account category',
    formula: '1. Filter where Type = "Customer"\n2. Group by Account_Category__c\n3. Count customers per category\n4. Sort by count descending',
    rawSources: 'salesforce_accounts: ID[Id]; salesforce_accounts: Type[Type]',
  },
  {
    id: 57, name: 'open cases', status: 'disabled',
    description: '',
    formula: '1. Filter cases where Status is not "Closed"\n2. Sort by CreatedDate descending',
    rawSources: 'salesforce_cases: Case ID[Id]; salesforce_cases: Status[Status]; salesforce_cases: Created Date[CreatedDate]',
  },
  {
    id: 58, name: 'risk customers with Open Opportunities', status: 'enabled',
    description: 'At risk customers with Open Opportunities',
    formula: '1. Filter where Type = "Customer"\n2. Identify accounts where Account_Health__c < 50\n3. Filter open opportunities (IsClosed = 0)\n4. Left join at-risk accounts with open opportunities\n5. Find largest open opportunity per account\n6. Sort by Health ascending, Amount descending',
    rawSources: 'salesforce_opportunities: Amount[Amount]; salesforce_opportunities: Close Date[CloseDate]; salesforce_opportunities: Closed[IsClosed]; salesforce_opportunities: Contact ID[ContactId]\nsalesforce_accounts: ID[Id]; salesforce_accounts: Type[Type]; salesforce_accounts: Health Score[Account_Health__c]\nsalesforce_contacts: Contact ID[Id]; salesforce_contacts: Account ID[AccountId]',
  },
  {
    id: 59, name: 'top-performing accounts with opportunities historical data', status: 'enabled',
    description: 'Top Performing Accounts.',
    formula: '1. Join salesforce_accounts with salesforce_opportunities on AccountId\n2. Calculate Total Won Revenue, Win Rate, Average Deal Size\n3. Join with salesforce_accounthistories for ARR Growth analysis\n4. Calculate Lead Conversion Rate from salesforce_leads\n5. Calculate composite score and flag top 10% as Top Performers',
    rawSources: 'salesforce_opportunities: Account ID[AccountId]; salesforce_opportunities: Amount[Amount]; salesforce_opportunities: Close Date[CloseDate]; salesforce_opportunities: Closed[IsClosed]; salesforce_opportunities: Won[IsWon]; salesforce_opportunities: Created Date[CreatedDate]\nsalesforce_accounts: ID[Id]; salesforce_accounts: ARR[ARR__c]; salesforce_accounts: Customer Start Date[Customer_Start_Date__c]\nsalesforce_contacts: Account ID[AccountId]; salesforce_contacts: MQL Date[MQL_Date__c]\nsalesforce_leads: Owner ID[OwnerId]; salesforce_leads: Created Date[CreatedDate]\nsalesforce_accounthistories: Account ID[AccountId]; salesforce_accounthistories: Created Date[CreatedDate]; salesforce_accounthistories: Old ARR[old_ARR__c]',
  },
];

/** Table display name map */
const TABLE_LABELS = {
  salesforce_opportunities: 'Opportunity',
  salesforce_accounts: 'Account',
  salesforce_contacts: 'Contact',
  salesforce_leads: 'Lead',
  salesforce_cases: 'Case',
  salesforce_tasks: 'Task',
  salesforce_users: 'User',
  salesforce_accounthistories: 'Account History',
  product_usage_extended: 'Product Usage',
  marketo_activity_fill_out_form: 'Form Activity',
  marketo_form: 'Form',
  marketo_lead: 'Lead (Marketo)',
};

/** Logo key map for source tables */
const TABLE_LOGO_KEYS = {
  salesforce_opportunities: 'salesforce',
  salesforce_accounts: 'salesforce',
  salesforce_contacts: 'salesforce',
  salesforce_leads: 'salesforce',
  salesforce_cases: 'salesforce',
  salesforce_tasks: 'salesforce',
  salesforce_users: 'salesforce',
  salesforce_accounthistories: 'salesforce',
  product_usage_extended: 'product_usage',
  marketo_activity_fill_out_form: 'marketo',
  marketo_form: 'marketo',
  marketo_lead: 'marketo',
};

/** Infer data type from column name */
function inferDataType(column) {
  const lower = column.toLowerCase();
  if (lower.includes('date') || lower === 'closedate' || lower === 'createddate') return 'Date';
  if (lower.includes('id') || lower === 'id') return 'Mediumtext';
  if (lower.includes('amount') || lower.includes('arr') || lower.includes('probability')) return 'Decimal';
  if (lower.startsWith('is') || lower.startsWith('has')) return 'Boolean';
  if (lower.includes('count') || lower.includes('visitors') || lower.includes('clicks') || lower.includes('fills')) return 'Integer';
  return 'Mediumtext';
}

/**
 * Parse the rawSources string into structured source columns.
 * Returns array of { fieldName, table, tableLabel, logoKey, column, dataType }
 */
export function parseSourceColumns(rawSources) {
  if (!rawSources) return [];
  const columns = [];
  const entries = rawSources.split(/[;\n]/).map((s) => s.trim()).filter(Boolean);

  for (const entry of entries) {
    const match = entry.match(/^(.+?):\s*(.+?)\[(.+?)\]$/);
    if (match) {
      const table = match[1].trim();
      const fieldName = match[2].trim();
      const column = match[3].trim();
      columns.push({
        fieldName,
        table,
        tableLabel: TABLE_LABELS[table] || table,
        logoKey: TABLE_LOGO_KEYS[table] || 'salesforce',
        column,
        dataType: inferDataType(column),
      });
    }
  }
  return columns;
}

/**
 * Extract unique integration keys from rawSources for the list view.
 */
export function extractSourceKeys(rawSources) {
  if (!rawSources) return [];
  const keys = new Set();
  const entries = rawSources.split(/[;\n]/).map((s) => s.trim()).filter(Boolean);
  for (const entry of entries) {
    const match = entry.match(/^(.+?):/);
    if (match) {
      const table = match[1].trim();
      const logoKey = TABLE_LOGO_KEYS[table];
      if (logoKey) keys.add(logoKey);
    }
  }
  return [...keys];
}
