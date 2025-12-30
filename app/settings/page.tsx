"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Building2, Globe, Save, Plus, Trash2, AlertCircle } from "lucide-react";
import { hoverCard, hoverTransition } from "@/lib/motion";

export default function SettingsPage() {
  // ========== STATE MANAGEMENT ==========
  
  // Application language preference
  const [language, setLanguage] = useState("en");
  
  // Company profile information stored in localStorage
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([""]);
  const [addresses, setAddresses] = useState<string[]>([""]);
  const [companyDescription, setCompanyDescription] = useState("");
  
  // Form submission and validation states
  const [isSaving, setIsSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Prevents editing after profile is saved
  const [isLocked, setIsLocked] = useState(false);

  // ========== DATA LOADING ==========
  
  // Load company profile from localStorage on component mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("companyProfile");
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        name?: string;
        email?: string;
        phoneNumbers?: string[];
        addresses?: string[];
        description?: string;
        locked?: boolean;
      };

      if (typeof parsed.name === "string") setCompanyName(parsed.name);
      if (typeof parsed.email === "string") setCompanyEmail(parsed.email);
      if (Array.isArray(parsed.phoneNumbers) && parsed.phoneNumbers.length) setPhoneNumbers(parsed.phoneNumbers);
      if (Array.isArray(parsed.addresses) && parsed.addresses.length) setAddresses(parsed.addresses);
      if (typeof parsed.description === "string") setCompanyDescription(parsed.description);
      if (typeof parsed.locked === "boolean") setIsLocked(parsed.locked);
    } catch {
      // ignore malformed stored profile
    }
    // run once
    
  }, []);

  // ========== VALIDATION ==========
  
  // Validate phone numbers before saving
  const validatePhoneNumbers = (): boolean => {
    const nonEmptyPhones = phoneNumbers.filter(p => p.trim());
    for (const phone of nonEmptyPhones) {
      if (phone.length < 8) {
        setValidationError("Phone numbers must be at least 8 digits");
        return false;
      }
    }
    
    setValidationError(null);
    return true;
  };

  // ========== EVENT HANDLERS ==========
  
  // Validate and open save confirmation dialog
  const handleSaveClick = () => {
    if (!validatePhoneNumbers()) {
      return;
    }
    setSaveDialogOpen(true);
  };

  // Save company profile to localStorage and lock form
  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "companyProfile",
          JSON.stringify({
            name: companyName.trim(),
            email: companyEmail.trim(),
            phoneNumbers: phoneNumbers.map((p) => p.trim()).filter(Boolean),
            addresses: addresses.map((a) => a.trim()).filter(Boolean),
            description: companyDescription.trim(),
            locked: true,
          })
        );
      }
    } catch {
      // ignore storage errors
    }
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
    setSaveDialogOpen(false);
    setIsLocked(true);
  };

  const handleReset = () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("companyProfile");
      }
    } catch {
      // ignore storage errors
    }

    setCompanyName("");
    setCompanyEmail("");
    setPhoneNumbers([""]);
    setAddresses([""]);
    setCompanyDescription("");
    setValidationError(null);
    setIsLocked(false);
  };

  const addPhoneNumber = () => {
    setPhoneNumbers([...phoneNumbers, ""]);
  };

  const removePhoneNumber = (index: number) => {
    setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
  };

  const updatePhoneNumber = (index: number, value: string) => {
    const numericValue = value.replace(/\D/g, "");
    const updated = [...phoneNumbers];
    updated[index] = numericValue;
    setPhoneNumbers(updated);
  };

  const addAddress = () => {
    setAddresses([...addresses, ""]);
  };

  const removeAddress = (index: number) => {
    setAddresses(addresses.filter((_, i) => i !== index));
  };

  const updateAddress = (index: number, value: string) => {
    const updated = [...addresses];
    updated[index] = value;
    setAddresses(updated);
  };

  const hasChanges = companyName || companyEmail || phoneNumbers.some(p => p) || addresses.some(a => a) || companyDescription;

  return (
    <div className="p-8 max-w-[1600px] mx-auto" dir="ltr">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.5,
          ease: [0.25, 0.1, 0.25, 1]
        }}
        className="mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground">Manage your company information and preferences</p>
        </div>
      </motion.div>

      <div className="flex flex-col items-center gap-8 max-w-2xl mx-auto">
        {/* Company Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
          whileHover={{ ...hoverCard, transition: hoverTransition }}
          className="w-full"
        >
          <Card className="overflow-hidden transition-shadow duration-300 ease-out hover:shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <Building2 className="h-5 w-5 text-primary" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Label htmlFor="company-name" className="text-sm font-bold">
                  Company Name:
                </Label>
                <Input
                  id="company-name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className="text-sm"
                  readOnly={isLocked}
                />
              </motion.div>

              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              >
                <Label htmlFor="company-email" className="text-sm font-bold">
                  Company Email:
                </Label>
                <Input
                  id="company-email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="Enter company email"
                  inputMode="email"
                  className="text-sm"
                  readOnly={isLocked}
                />
              </motion.div>

              <motion.div 
                className="space-y-2 md:col-span-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Label className="text-sm font-bold">Phone Numbers:</Label>
                <div className="space-y-2">
                  {phoneNumbers.map((phone, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex gap-2"
                    >
                      <Input
                        value={phone}
                        onChange={(e) => updatePhoneNumber(index, e.target.value)}
                        placeholder="Enter phone number (digits only)"
                        inputMode="numeric"
                        className="flex-1 text-sm"
                        readOnly={isLocked}
                      />
                      {phoneNumbers.length > 1 && (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removePhoneNumber(index)}
                            className="text-destructive hover:bg-destructive/10"
                            disabled={isLocked}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
                {validationError && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-sm text-destructive"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {validationError}
                  </motion.div>
                )}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addPhoneNumber}
                    className="mt-2 flex items-center gap-2 text-sm"
                    disabled={isLocked}
                  >
                    <Plus className="h-4 w-4" />
                    Add Phone Number
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div 
                className="space-y-2 md:col-span-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 }}
              >
                <Label className="text-sm font-bold">Addresses:</Label>
                <div className="space-y-2">
                  {addresses.map((address, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex gap-2"
                    >
                      <Input
                        value={address}
                        onChange={(e) => updateAddress(index, e.target.value)}
                        placeholder="Enter address (street, city, country)"
                        className="flex-1 text-sm"
                        readOnly={isLocked}
                      />
                      {addresses.length > 1 && (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeAddress(index)}
                            className="text-destructive hover:bg-destructive/10"
                            disabled={isLocked}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addAddress}
                    className="mt-2 flex items-center gap-2 text-sm"
                    disabled={isLocked}
                  >
                    <Plus className="h-4 w-4" />
                    Add Address
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div 
                className="space-y-2 md:col-span-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Label htmlFor="company-description" className="text-sm font-bold">
                  Business Description:
                </Label>
                <textarea
                  id="company-description"
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Enter business description and details"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                  readOnly={isLocked}
                />
              </motion.div>
            </div>

            <div className="flex items-center justify-center gap-3 mt-6 pt-6 border-t">
              <motion.div
                whileHover={hasChanges ? { scale: 1.05 } : {}}
                whileTap={hasChanges ? { scale: 0.95 } : {}}
                transition={hoverTransition}
              >
                <Button 
                  onClick={handleSaveClick} 
                  disabled={!hasChanges || isLocked}
                  className="flex items-center gap-2 text-sm font-bold"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={hoverTransition}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="text-sm"
                >
                  Reset
                </Button>
              </motion.div>
            </div>
          </CardContent>
          </Card>
      </motion.div>

      {/* Language Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        whileHover={{ ...hoverCard, transition: hoverTransition }}
        className="w-full"
      >
        <Card className="overflow-hidden transition-shadow duration-300 ease-out hover:shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <Globe className="h-5 w-5 text-primary" />
              Language & Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <motion.div 
              className="space-y-4 max-w-sm mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <div className="space-y-2">
                <Label htmlFor="language-select" className="text-sm font-bold">
                  Interface Language:
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language-select" className="text-sm" disabled={isLocked}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <motion.div 
                className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <p className="text-sm text-foreground font-semibold">
                  Selected: <span className="text-primary font-bold">{language === "en" ? "English" : language === "fr" ? "Français" : "العربية"}</span>
                </p>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
      </div>
      {/* Save Confirmation Modal */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Confirm Changes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to save these changes to your company information?
          </p>
          <div className="rounded-lg bg-muted/50 p-3 space-y-2 text-sm">
            {companyName && <p><span className="font-semibold">Company Name:</span> {companyName}</p>}
            {companyEmail && <p><span className="font-semibold">Email:</span> {companyEmail}</p>}
            {phoneNumbers.some(p => p) && (
              <p><span className="font-semibold">Phone Numbers:</span> {phoneNumbers.filter(p => p).join(", ")}</p>
            )}
            {addresses.some(a => a) && (
              <p><span className="font-semibold">Addresses:</span> {addresses.filter(a => a).join(", ")}</p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
              className="text-sm"
            >
              Cancel
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={handleConfirmSave}
              disabled={isSaving}
              className="flex items-center gap-2 text-sm font-bold"
            >
              {isSaving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Save className="h-4 w-4" />
                  </motion.div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </div>
  );
}
