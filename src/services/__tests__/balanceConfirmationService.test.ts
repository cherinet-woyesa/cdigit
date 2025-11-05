// __tests__/balanceConfirmationService.test.ts
// Note: This test file requires a testing framework like Jest/Vitest to be configured

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { balanceConfirmationService } from '../balanceConfirmationService';
import type { BalanceConfirmationData } from '../balanceConfirmationService';

// Mock apiClient
vi.mock('../apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('BalanceConfirmationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitBalanceConfirmation', () => {
    it('calls API with correct payload structure', async () => {
      const { apiClient } = require('../apiClient');
      const mockResponse = { success: true, data: { id: 'test-id' } };
      apiClient.post.mockResolvedValue(mockResponse);

      const testData: BalanceConfirmationData = {
        phoneNumber: '+251911234567',
        branchId: 'branch-123',
        accountNumber: '1234567890',
        customerName: 'John Doe',
        accountOpenedDate: '2023-01-01',
        balanceAsOfDate: '2024-01-01',
        creditBalance: 5000,
        embassyOrConcernedOrgan: 'Test Embassy',
        location: 'Addis Ababa',
        otpCode: '123456',
      };

      await balanceConfirmationService.submitBalanceConfirmation(testData);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/BalanceConfirmation/submit',
        {
          PhoneNumber: testData.phoneNumber,
          BranchId: testData.branchId,
          AccountNumber: testData.accountNumber,
          CustomerName: testData.customerName,
          AccountOpenedDate: testData.accountOpenedDate,
          BalanceAsOfDate: testData.balanceAsOfDate,
          CreditBalance: testData.creditBalance,
          EmbassyOrConcernedOrgan: testData.embassyOrConcernedOrgan,
          Location: testData.location,
          OtpCode: testData.otpCode,
        },
        undefined
      );
    });

    it('handles optional fields correctly', async () => {
      const { apiClient } = require('../apiClient');
      apiClient.post.mockResolvedValue({ success: true });

      const testData: BalanceConfirmationData = {
        phoneNumber: '+251911234567',
        branchId: 'branch-123',
        accountNumber: '1234567890',
        customerName: 'John Doe',
        accountOpenedDate: '2023-01-01',
        balanceAsOfDate: '2024-01-01',
        creditBalance: 5000,
        otpCode: '123456',
      };

      await balanceConfirmationService.submitBalanceConfirmation(testData);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/BalanceConfirmation/submit',
        expect.objectContaining({
          EmbassyOrConcernedOrgan: null,
          Location: null,
        }),
        undefined
      );
    });

    it('includes authorization header when token provided', async () => {
      const { apiClient } = require('../apiClient');
      apiClient.post.mockResolvedValue({ success: true });

      const testData: BalanceConfirmationData = {
        phoneNumber: '+251911234567',
        branchId: 'branch-123',
        accountNumber: '1234567890',
        customerName: 'John Doe',
        accountOpenedDate: '2023-01-01',
        balanceAsOfDate: '2024-01-01',
        creditBalance: 5000,
        otpCode: '123456',
      };

      const token = 'test-token';
      await balanceConfirmationService.submitBalanceConfirmation(testData, token);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/BalanceConfirmation/submit',
        expect.any(Object),
        { Authorization: `Bearer ${token}` }
      );
    });
  });

  describe('getBalanceConfirmationById', () => {
    it('calls correct API endpoint', async () => {
      const { apiClient } = require('../apiClient');
      const mockResponse = { success: true, data: { id: 'test-id' } };
      apiClient.get.mockResolvedValue(mockResponse);

      const id = 'test-id';
      const result = await balanceConfirmationService.getBalanceConfirmationById(id);

      expect(apiClient.get).toHaveBeenCalledWith(`/BalanceConfirmation/${id}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateBalanceConfirmation', () => {
    it('calls API with correct update payload', async () => {
      const { apiClient } = require('../apiClient');
      apiClient.put.mockResolvedValue({ success: true });

      const id = 'test-id';
      const updateData = {
        customerName: 'Updated Name',
        creditBalance: 10000,
        embassyOrConcernedOrgan: 'Updated Embassy',
      };

      await balanceConfirmationService.updateBalanceConfirmation(id, updateData);

      expect(apiClient.put).toHaveBeenCalledWith(
        `/BalanceConfirmation/${id}`,
        {
          CustomerName: updateData.customerName,
          AccountOpenedDate: undefined,
          BalanceAsOfDate: undefined,
          CreditBalance: updateData.creditBalance,
          EmbassyOrConcernedOrgan: updateData.embassyOrConcernedOrgan,
          Location: null,
          Status: undefined,
        }
      );
    });
  });

  describe('cancelBalanceConfirmation', () => {
    it('calls correct cancellation endpoint', async () => {
      const { apiClient } = require('../apiClient');
      apiClient.put.mockResolvedValue({ success: true });

      const id = 'test-id';
      await balanceConfirmationService.cancelBalanceConfirmation(id);

      expect(apiClient.put).toHaveBeenCalledWith(`/BalanceConfirmation/cancel-by-customer/${id}`);
    });
  });

  describe('error handling', () => {
    it('propagates API errors correctly', async () => {
      const { apiClient } = require('../apiClient');
      const error = new Error('Network error');
      apiClient.post.mockRejectedValue(error);

      const testData: BalanceConfirmationData = {
        phoneNumber: '+251911234567',
        branchId: 'branch-123',
        accountNumber: '1234567890',
        customerName: 'John Doe',
        accountOpenedDate: '2023-01-01',
        balanceAsOfDate: '2024-01-01',
        creditBalance: 5000,
        otpCode: '123456',
      };

      await expect(
        balanceConfirmationService.submitBalanceConfirmation(testData)
      ).rejects.toThrow('Network error');
    });
  });
});