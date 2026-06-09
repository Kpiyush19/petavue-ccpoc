import { useState } from "react";
import { Modal } from "../../common-components/Modal";
import { Button } from "../../common-components/Button";
import MarkdownRenderer from "../../common-utils/MarkdownRenderer";
import { accepttnc } from "./api/accepttnc";

const tncText = `
# EXHIBIT A

## 1. SAAS SERVICES AND SUPPORT
- Subject to the terms of this Agreement, Company will use commercially reasonable efforts to provide Customer the Services [in accordance with the Service Level Terms attached hereto as Exhibit B].  As part of the registration process, Customer will identify an administrative user name and password for Customer's Company account.  Company reserves the right to refuse registration of, or cancel passwords it deems inappropriate.
- Subject to the terms hereof, Company will provide Customer with reasonable technical support services in accordance with Company's standard practice.

## 2. RESTRICTIONS AND RESPONSIBILITIES
- Customer will not, directly or indirectly: reverse engineer, decompile, disassemble or otherwise attempt to discover the source code, object code or underlying structure, ideas, know-how or algorithms relevant to the Services or any software, documentation or data related to the Services ("Software"); modify, translate, or create derivative works based on the Services or any Software (except to the extent expressly permitted by Company or authorized within the Services); use the Services or any Software for timesharing or service bureau purposes or otherwise for the benefit of a third; or remove any proprietary notices or labels.
- Customer represents, covenants, and warrants that Customer will use the Services only in compliance with all applicable laws and regulations. Although Company has no obligation to monitor Customer's use of the Services, Company may do so and may prohibit any use of the Services it believes may be (or alleged to be) in violation of the foregoing.
- Customer shall be responsible for obtaining and maintaining any equipment and ancillary services needed to connect to, access or otherwise use the Services, including, without limitation, modems, hardware, servers, software, operating systems, networking, web servers and the like (collectively, "Equipment"). Customer shall also be responsible for maintaining the security of the Equipment, Customer account, passwords (including but not limited to administrative and user passwords) and files, and for all uses of Customer account or the Equipment with or without Customer's knowledge or consent.

## 3. CONFIDENTIALITY; PROPRIETARY RIGHTS
- Each party (the "Receiving Party") understands that the other party (the "Disclosing Party") has disclosed or may disclose business, technical or financial information relating to the Disclosing Party's business (hereinafter referred to as "Proprietary Information" of the Disclosing Party). Proprietary Information of Company includes non-public information regarding features, functionality and performance of the Service. Proprietary Information of Customer includes non-public data provided by Customer to Company to enable the provision of the Services ("Customer Data"). The Receiving Party agrees: (i) to take reasonable precautions to protect such Proprietary Information, and (ii) not to use (except in performance of the Services or as otherwise permitted herein) or divulge to any third person any such Proprietary Information. The Disclosing Party agrees that the foregoing shall not apply with respect to any information after five (5) years following the disclosure thereof or any information that the Receiving Party can document (a) is or becomes generally available to the public, or (b) was in its possession or known by it prior to receipt from the Disclosing Party, or (c) was rightfully disclosed to it without restriction by a third party, or (d) was independently developed without use of any Proprietary Information of the Disclosing Party or (e) is required to be disclosed by law.
- Customer shall own all right, title and interest in and to the Customer Data. Company shall own and retain all right, title and interest in and to (a) the Services and Software, all improvements, enhancements or modifications thereto, (b) any software, applications, inventions or other technology developed in connection with Implementation Services or support, and (c) all intellectual property rights related to any of the foregoing.
- Notwithstanding anything to the contrary, Company shall own any derived data and have the right to collect and analyze data and other information relating to the provision, use and performance of various aspects of the Services and related systems and technologies (including, without limitation, information concerning Customer Data and data derived therefrom), and Company will be free (during and after the term hereof) to (i) use such information and data to improve and enhance the Services and for other development, diagnostic and corrective purposes in connection with the Services and other Company offerings, and (ii) disclose such data solely in aggregate or other de-identified form in connection with its business. No rights or licenses are granted except as expressly set forth herein.

## 4. PAYMENT OF FEES
- Customer will pay Company the then applicable fees described in the Order Form for the Services and Implementation Services in accordance with the terms therein (the "Fees"). If Customer's use of the Services exceeds the Service Capacity set forth on the Order Form or otherwise requires the payment of additional fees (per the terms of this Agreement), Customer shall be billed for such usage and Customer agrees to pay the additional fees in the manner provided herein. Company reserves the right to change the Fees or applicable charges and to institute new charges and Fees at the end of the Initial Service Term or then current renewal term, upon thirty (30) days prior notice to Customer (which may be sent by email). If Customer believes that Company has billed Customer incorrectly, Customer must contact Company no later than 60 days after the closing date on the first billing statement in which the error or problem appeared, in order to receive an adjustment or credit. Inquiries should be directed to Company's customer support department.
- Company may choose to bill through an invoice, in which case, full payment for invoices issued in any given month must be received by Company thirty (30) days after the mailing date of the invoice. Unpaid amounts are subject to a finance charge of 1.5% per month on any outstanding balance, or the maximum permitted by law, whichever is lower, plus all expenses of collection and may result in immediate termination of Service. Customer shall be responsible for all taxes associated with Services other than U.S. taxes based on Company's net income.

## 5. TERM AND TERMINATION
- This agreement will not automatically renew. Renewal will only occur if both parties mutually agree in writing to a renewal and establish a defined renewal start date prior to the expiration of the current term.
- In addition to any other remedies it may have, either party may also terminate this Agreement upon thirty (30) days' notice (or without notice in the case of nonpayment), if the other party materially breaches any of the terms or conditions of this Agreement. Customer will pay in full for the Services up to and including the last day on which the Services are provided. Upon any termination, Company will make all Customer Data available to Customer for electronic retrieval for a period of thirty (30) days, but thereafter Company may, but is not obligated to, delete stored Customer Data. All sections of this Agreement which by their nature should survive termination will survive termination, including, without limitation, accrued rights to payment, confidentiality obligations, warranty disclaimers, and limitations of liability.

## 6. WARRANTY AND DISCLAIMER
Company shall use reasonable efforts consistent with prevailing industry standards to maintain the services in a manner which minimizes errors and interruptions in the services and shall perform the implementation services in a professional and workmanlike manner. Services may be temporarily unavailable for scheduled maintenance or for unscheduled emergency maintenance, either by Company or by third-party providers, or because of other causes beyond Company's reasonable control, but Company shall use reasonable efforts to provide advance notice in writing or by e-mail of any scheduled service disruption. However, Company does not warrant that the services will be uninterrupted or error free; nor does it make any warranty as to the results that may be obtained from use of the services. Except as expressly set forth in this section, the services and implementation services are provided "as is" and Company disclaims all warranties, express or implied, including, but not limited to, implied warranties of merchantability and fitness for a particular purpose and non-infringement.

## 7. INDEMNITY
Company shall hold Customer harmless from liability to third parties resulting from infringement by the Service of any United States patent or any copyright or misappropriation of any trade secret, provided Company is promptly notified of any and all threats, claims and proceedings related thereto and given reasonable assistance and the opportunity to assume sole control over defense and settlement; Company will not be responsible for any settlement it does not approve in writing. The foregoing obligations do not apply with respect to portions or components of the Service (i) not supplied by Company, (ii) made in whole or in part in accordance with Customer specifications, (iii) that are modified after delivery by Company, (iv) combined with other products, processes or materials where the alleged infringement relates to such combination, (v) where Customer continues allegedly infringing activity after being notified thereof or after being informed of modifications that would have avoided the alleged infringement, or (vi) where Customer's use of the Service is not strictly in accordance with this Agreement. If, due to a claim of infringement, the Services are held by a court of competent jurisdiction to be or are believed by Company to be infringing, Company may, at its option and expense (a) replace or modify the Service to be non-infringing provided that such modification or replacement contains substantially similar features and functionality, (b) obtain for Customer a license to continue using the Service, or (c) if neither of the foregoing is commercially practicable, terminate this Agreement and Customer's rights hereunder and provide Customer a refund of any prepaid, unused fees for the Service.

## 8. LIMITATION OF LIABILITY
Notwithstanding anything to the contrary, except for bodily injury of a person, Company and its suppliers (including but not limited to all equipment and technology suppliers), officers, affiliates, representatives, contractors and employees shall not be responsible or liable with respect to any subject matter of this agreement or terms and conditions related thereto under any contract, negligence, strict liability or other theory: (a) for error or interruption of use or for loss or inaccuracy or corruption of data or cost of procurement of substitute goods, services or technology or loss of business; (b) for any indirect, exemplary, incidental, special or consequential damages; (c) for any matter beyond Company's reasonable control; or (d) for any amounts that, together with amounts associated with all other claims, exceed the fees paid by Customer to Company for the services under this agreement in the 12 months prior to the act that gave rise to the liability, in each case, whether or not Company has been advised of the possibility of such damages.

## 9. MISCELLANEOUS
If any provision of this Agreement is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that this Agreement will otherwise remain in full force and effect and enforceable. This Agreement is not assignable, transferable or sublicensable by Customer except with Company's prior written consent. Company may transfer and assign any of its rights and obligations under this Agreement without consent. This Agreement is the complete and exclusive statement of the mutual understanding of the parties and supersedes and cancels all previous written and oral agreements, communications and other understandings relating to the subject matter of this Agreement, and that all waivers and modifications must be in a writing signed by both parties, except as otherwise provided herein. No agency, partnership, joint venture, or employment is created as a result of this Agreement and Customer does not have any authority of any kind to bind Company in any respect whatsoever. In any action or proceeding to enforce rights under this Agreement, the prevailing party will be entitled to recover costs and attorneys' fees. All notices under this Agreement will be in writing and will be deemed to have been duly given when received, if personally delivered; when receipt is electronically confirmed, if transmitted by facsimile or e-mail; the day after it is sent, if sent for next day delivery by recognized overnight delivery service; and upon receipt, if sent by certified or registered mail, return receipt requested. This Agreement shall be governed by the laws of the State of Washington without regard to its conflict of laws provisions.

The parties may work together in good faith to issue at least one mutually agreed upon press release within 90 days of the Effective Date, and Customer otherwise agrees to reasonably cooperate with Company to serve as a reference account upon request.

# EXHIBIT B

## Service Level Terms and Support Hours
The Services shall be available 99.9%, measured monthly, excluding holidays and weekends and scheduled maintenance. If Customer requests maintenance during these hours, any uptime or downtime calculation will exclude periods affected by such maintenance. Further, any downtime resulting from outages of third party connections or utilities or other reasons beyond Company's control will also be excluded from any such calculation. Customer's sole and exclusive remedy, and Company's entire liability, in connection with Service availability shall be that for each period of downtime lasting longer than two hours, Company will credit Customer 5% of Service fees for each period of 30 or more consecutive minutes of downtime; provided that no more than one such credit will accrue per day. Downtime shall begin to accrue as soon as Customer (with notice to Company) recognizes that downtime is taking place, and continues until the availability of the Services is restored. In order to receive downtime credit, Customer must notify Company in writing within 24 hours from the time of downtime, and failure to provide such notice will forfeit the right to receive downtime credit. Such credits may not be redeemed for cash and shall not be cumulative beyond a total of credits for one (1) week of Service Fees in any one (1) calendar month in any event. Company will only apply a credit to the month in which the incident occurred. Company's blocking of data communications or other Service in accordance with its policies shall not be deemed to be a failure of Company to provide adequate service levels under this Agreement.

## Service Level Agreement (SLA):

| Request Type | Response Time |
| :--- | :--- |
| First response to initial ticket (Acknowledging the request to an existing insights report) | 1 hour |
| Insights Report edit requests - edits to an existing outcome/report | 4-6 hours |
| New insights report creation | 2 Business Days |

_Support hours: 9 AM - 5 PM Eastern Time, excluding weekends and U.S. federal holidays_
_All requests are submitted via the Petavue service portal_
`;

export default function TNCModal({ isOpen, onClose, authDeets, onAccept }) {
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  const acceptHandler = async () => {
    try {
      setAccepting(true);
      setError("");
      await accepttnc(authDeets);
      onAccept();
    } catch (e) {
      setError("Failed to accept terms. Please try again.");
      setAccepting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Terms of Service"
      showCloseBtn={false}
      className="!w-[950px] max-w-[95vw]"
      styles={{ modal: { width: "950px", maxWidth: "95vw" } }}
      topStripClassName="hidden"
      headerClassName="border-b border-pv-neutral-grey-100 px-6 py-4"
    >
      <div className="flex flex-col h-[600px] max-h-[70vh]">
        <div className="flex-1 overflow-y-auto px-8 pb-6 pt-4">
          {error && (
            <div className="text-sm text-pv-error-text bg-pv-error-bg border border-pv-error-border rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}
          <MarkdownRenderer
            content={tncText}
            className="[&_li]:text-[var(--pv-text-secondary-text)] [&_p]:text-[var(--pv-text-secondary-text)]"
          />
        </div>
        <div className="flex justify-between items-center px-8 py-4 border-t border-pv-neutral-grey-100">
          <Button onClick={onClose} btnColor="ghost" btnSize="lg" disabled={accepting}>
            Decline
          </Button>
          <Button onClick={acceptHandler} btnSize="lg" disabled={accepting}>
            {accepting ? "Accepting..." : "Accept"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
