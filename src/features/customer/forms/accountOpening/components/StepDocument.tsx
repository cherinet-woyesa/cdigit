import React, { useState } from "react";
import Field from '../../../../../components/Field';
import type { DocumentDetail, Errors } from "../types/formTypes";
import { Loader2, ChevronRight, FileText, Calendar, Upload, CheckCircle2 } from 'lucide-react';

export const validate = (data: DocumentDetail): Errors<DocumentDetail> => {
    const newErrors: Errors<DocumentDetail> = {};
    if (!data.idType) newErrors.idType = "ID Type is required";
    if (!data.idPassportNo) newErrors.idPassportNo = "ID / Passport No. is required";
    if (!data.issuedBy) newErrors.issuedBy = "Issued By is required";
    if (!data.issueDate) newErrors.issueDate = "Issue Date is required";
    if (!data.expiryDate) newErrors.expiryDate = "Expiry Date is required";
    if (data.issueDate && data.expiryDate) {
        try {
            const issue = new Date(data.issueDate);
            const expiry = new Date(data.expiryDate);
            if (expiry < issue) newErrors.expiryDate = 'Expiry date must be after issue date';
        } catch {}
    }
    if (!data.mobilePhoneNo) newErrors.mobilePhoneNo = "Mobile Phone is required";
    else if (!/^09\d{8}$|^\+2519\d{8}$/.test(data.mobilePhoneNo)) newErrors.mobilePhoneNo = 'Invalid Ethiopian phone number';
    if (!data.photoIdFile && !data.docPhotoUrl) newErrors.docPhotoUrl = "Document photo is required";
    return newErrors;
};

type StepDocumentProps = {
    data: DocumentDetail;
    setData: (d: DocumentDetail) => void;
    errors: Errors<DocumentDetail>;
    onNext: (errors: Errors<DocumentDetail>) => void;
    onBack: () => void;
    submitting: boolean;
};

export function StepDocument({ data, setData, errors, onNext, onBack, submitting }: StepDocumentProps) {
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | undefined>(undefined);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value } as any);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileError(undefined);
        setFilePreview(null);
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setFileError('Only image files (JPEG, PNG) are allowed.');
                setData({ ...data, photoIdFile: undefined });
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                setFileError('File size must be less than 2MB.');
                setData({ ...data, photoIdFile: undefined });
                return;
            }
            setData({ ...data, photoIdFile: file });
            const reader = new FileReader();
            reader.onload = (ev) => setFilePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setData({ ...data, photoIdFile: undefined });
        }
    };

    const formatDateForInput = (isoDate: string | undefined): string => {
        if (!isoDate) return "";
        try { return isoDate.split("T")[0]; } catch { return ""; }
    };

    const handleNext = () => {
        const validationErrors = validate(data);
        onNext(validationErrors);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-fuchsia-100 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-fuchsia-700" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Document Verification</h2>
                    <p className="text-gray-600 text-sm">Upload your identification documents</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ID Type */}
                <Field label="ID Type" required error={errors.idType}>
                    <select
                        className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors bg-white"
                        name="idType"
                        value={data.idType}
                        onChange={handleChange}
                    >
                        <option value="">Select ID Type</option>
                        <option value="National ID">National ID</option>
                        <option value="Passport">Passport</option>
                        <option value="Driver's License">Driver's License</option>
                        <option value="Resident Permit">Resident Permit</option>
                    </select>
                </Field>

                {/* ID Number */}
                <Field label="ID / Passport No." required error={errors.idPassportNo}>
                    <input
                        type="text"
                        name="idPassportNo"
                        className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors"
                        value={data.idPassportNo}
                        onChange={handleChange}
                        placeholder="Enter your ID number"
                    />
                </Field>

                {/* Issued By */}
                <Field label="Issued By" required error={errors.issuedBy}>
                    <input
                        type="text"
                        name="issuedBy"
                        className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors"
                        value={data.issuedBy}
                        onChange={handleChange}
                        placeholder="Issuing authority"
                    />
                </Field>

                {/* Issue Date */}
                <Field label="Issue Date" required error={errors.issueDate}>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="date"
                            name="issueDate"
                            className="w-full pl-10 p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors"
                            value={formatDateForInput(data.issueDate)}
                            onChange={handleChange}
                        />
                    </div>
                </Field>

                {/* Expiry Date */}
                <Field label="Expiry Date" required error={errors.expiryDate}>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="date"
                            name="expiryDate"
                            className="w-full pl-10 p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors"
                            value={formatDateForInput(data.expiryDate)}
                            onChange={handleChange}
                        />
                    </div>
                </Field>

                {/* Mobile Phone */}
                <Field label="Mobile Phone" required error={errors.mobilePhoneNo}>
                    <input
                        type="tel"
                        name="mobilePhoneNo"
                        className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors"
                        value={data.mobilePhoneNo}
                        onChange={handleChange}
                        placeholder="09XXXXXXXX"
                    />
                </Field>

                {/* Email */}
                <Field label="Email" error={errors.docEmail}>
                    <input
                        type="email"
                        name="docEmail"
                        className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-colors"
                        value={data.docEmail || ''}
                        onChange={handleChange}
                        placeholder="email@example.com"
                    />
                </Field>

                {/* Document Upload */}
                <div className="md:col-span-2">
                    <Field label="Upload Photo of ID" required error={errors.docPhotoUrl || fileError}>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-fuchsia-400 transition-colors">
                            <input
                                type="file"
                                name="photoIdFile"
                                className="hidden"
                                id="photoIdFile"
                                onChange={handleFileChange}
                                accept="image/*"
                            />
                            <label htmlFor="photoIdFile" className="cursor-pointer">
                                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-600 font-medium">Click to upload ID photo</p>
                                <p className="text-gray-500 text-sm">JPEG or PNG, max 2MB</p>
                            </label>
                        </div>
                        {filePreview && (
                            <div className="mt-4 flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span className="text-green-700 text-sm">File selected successfully</span>
                            </div>
                        )}
                        {data.docPhotoUrl && !filePreview && (
                            <p className="text-sm text-gray-500 mt-2">Document already uploaded</p>
                        )}
                    </Field>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                    type="button"
                    className="px-8 py-3 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
                    onClick={onBack}
                    disabled={submitting}
                >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    Back
                </button>
                <button
                    type="button"
                    className={`px-8 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200 flex items-center gap-2 ${
                        submitting 
                            ? 'bg-fuchsia-300 cursor-not-allowed text-white' 
                            : 'bg-fuchsia-700 text-white hover:bg-fuchsia-800 hover:scale-105'
                    }`}
                    onClick={handleNext}
                    disabled={submitting}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            Continue
                            <ChevronRight className="h-4 w-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}