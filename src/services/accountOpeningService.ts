// src/services/accountOpeningService.ts
import axios from 'axios';
import type { AccountOpeningFormData } from '../types/formTypes';


const API_BASE_URL = 'http://localhost:5268/api'; // *** ADJUST THIS TO YOUR ACTUAL BACKEND URL ***

interface AccountOpeningResponse {
  message: string;
  customerId?: number;
  referenceId?: string; // If your backend returns a reference ID
}

interface BackendErrorResponse {
  Message?: string;
  errors?: { [key: string]: string[] }; // For validation errors
}

const accountOpeningService = {
  submitAccountOpening: async (formData: AccountOpeningFormData): Promise<AccountOpeningResponse> => {
    try {
      const payload = new FormData();

      // Create a single JSON object for all non-file data
      // We explicitly exclude the File properties from the JSON part
      const jsonData = {
        PersonalDetails: formData.PersonalDetails,
        AddressDetails: formData.AddressDetails,
        FinancialDetails: formData.FinancialDetails,
        OtherDetails: formData.OtherDetails,
        EPaymentServices: formData.EPaymentServices,
        PassbookMudayRequest: formData.PassbookMudayRequest,
        // For DocumentDetails and DigitalSignature, create new objects excluding the File properties
        DocumentDetails: {
          IdType: formData.DocumentDetails.IdType,
          IdPassportNo: formData.DocumentDetails.IdPassportNo,
          IdIssueDate: formData.DocumentDetails.IdIssueDate,
          IdExpiryDate: formData.DocumentDetails.IdExpiryDate,
          IdIssuePlace: formData.DocumentDetails.IdIssuePlace,
          // PhotoIdFile is excluded from JSON part
        },
        DigitalSignature: {
          TermsAccepted: formData.DigitalSignature.TermsAccepted,
          // PhotoFile is excluded from JSON part
        },
      };

      // Append the stringified JSON data under a single key
      // The key 'JsonData' MUST match the property name in your backend's AccountOpeningRequestDto
      payload.append('JsonData', JSON.stringify(jsonData));

      // Append files separately with keys matching AccountOpeningRequestDto properties
      // These keys MUST match the IFormFile property names in your backend's AccountOpeningRequestDto
      if (formData.DocumentDetails.PhotoIdFile) {
        payload.append('PhotoIdFile', formData.DocumentDetails.PhotoIdFile);
      }
      if (formData.DigitalSignature.PhotoFile) {
        payload.append('DigitalSignaturePhotoFile', formData.DigitalSignature.PhotoFile);
      }

      // Debugging: Log FormData contents (for development only, remove in production)
      for (let pair of payload.entries()) {
        console.log(pair[0]+ ': ' + (typeof pair[1] === 'string' ? pair[1] : (pair[1] as File).name));
      }

      const response = await axios.post<AccountOpeningResponse>(
        `${API_BASE_URL}/AccountOpening/submit`,
        payload,
        {
          headers: {
            // Axios sets 'Content-Type': 'multipart/form-data' automatically with FormData
            // No need to set it manually here.
          },
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorData: BackendErrorResponse = error.response.data;
        let errorMessage = "Submission failed: ";
        if (errorData.Message) {
          errorMessage += errorData.Message;
        } else if (errorData.errors) {
          // Flatten ASP.NET Core ModelState errors
          for (const key in errorData.errors) {
            errorMessage += `${key}: ${errorData.errors[key].join(', ')} | `;
          }
          errorMessage = errorMessage.slice(0, -3); // Remove trailing " | "
        } else {
          errorMessage += error.message;
        }
        throw new Error(errorMessage);
      } else {
        throw new Error("An unexpected error occurred during submission.");
      }
    }
  },
};

export default accountOpeningService;