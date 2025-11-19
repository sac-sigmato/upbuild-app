export type VisitorFormFieldsProps = {
  // Left column props
  name: string;
  setName: (v: string) => void;
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  gender: string;
  setGender: (v: string) => void;
  visitorType: string;
  setVisitorType: (v: string) => void;
  customVisitorType: string;
  setCustomVisitorType: (v: string) => void;
  photo: any | null;
  setPhoto: (p: any | null) => void;
  previewUrl: string | null;
  setPreviewUrl: (u: string | null) => void;

  // Right column props
  vehicleType: string;
  setVehicleType: (v: string) => void;
  vehicleNumber: string;
  setVehicleNumber: (v: string) => void;
  vehiclePhoto: any | null;
  setVehiclePhoto: (p: any | null) => void;
  vehiclePhotoPreview: string | null;
  setVehiclePhotoPreview: (u: string | null) => void;
  flatId: string;
  setFlatId: (v: string) => void;
  clockInTime: string;
  setClockInTime: (v: string) => void;
  purpose: string;
  setPurpose: (v: string) => void;
  scheduleDate: string;
  setScheduleDate: (v: string) => void;
  scheduleFrom: string;
  setScheduleFrom: (v: string) => void;
  scheduleTo: string;
  setScheduleTo: (v: string) => void;
  flats: any[];
  status: string;
  setStatus: (v: string) => void;

  // Image picker function
  pickImage?: (
    setImage: (img: any | null) => void,
    setPreview: (url: string | null) => void
  ) => void;
};
