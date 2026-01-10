import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useFuelTypes, useCreateFuelType, useUpdateFuelType, useDeleteFuelType,
  useBodyTypes, useCreateBodyType, useUpdateBodyType, useDeleteBodyType,
  useTransmissions, useCreateTransmission, useUpdateTransmission, useDeleteTransmission,
  useSeatOptions, useCreateSeatOption, useUpdateSeatOption, useDeleteSeatOption,
  useYears, useCreateYear, useUpdateYear, useDeleteYear,
} from '@/hooks/useTypes';

export function TypeManager() {
  const [activeTab, setActiveTab] = useState('fuel');
  const [validationError, setValidationError] = useState<string>('');
  
  // Fuel Types
  const { data: fuelTypes = [], isLoading: fuelLoading } = useFuelTypes();
  const createFuelType = useCreateFuelType();
  const updateFuelType = useUpdateFuelType();
  const deleteFuelType = useDeleteFuelType();
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [editingFuel, setEditingFuel] = useState<any>(null);
  const [fuelFormData, setFuelFormData] = useState({ name: '', is_active: true });

  // Body Types
  const { data: bodyTypes = [], isLoading: bodyLoading } = useBodyTypes();
  const createBodyType = useCreateBodyType();
  const updateBodyType = useUpdateBodyType();
  const deleteBodyType = useDeleteBodyType();
  const [isBodyModalOpen, setIsBodyModalOpen] = useState(false);
  const [editingBody, setEditingBody] = useState<any>(null);
  const [bodyFormData, setBodyFormData] = useState({ name: '', icon: '', is_active: true });

  // Transmissions
  const { data: transmissions = [], isLoading: transLoading } = useTransmissions();
  const createTransmission = useCreateTransmission();
  const updateTransmission = useUpdateTransmission();
  const deleteTransmission = useDeleteTransmission();
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [editingTrans, setEditingTrans] = useState<any>(null);
  const [transFormData, setTransFormData] = useState({ name: '', is_active: true });

  // Seat Options
  const { data: seatOptions = [], isLoading: seatsLoading } = useSeatOptions();
  const createSeatOption = useCreateSeatOption();
  const updateSeatOption = useUpdateSeatOption();
  const deleteSeatOption = useDeleteSeatOption();
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [editingSeat, setEditingSeat] = useState<any>(null);
  const [seatFormData, setSeatFormData] = useState({ seats: 5, is_active: true });

  // Years
  const { data: years = [], isLoading: yearsLoading } = useYears();
  const createYear = useCreateYear();
  const updateYear = useUpdateYear();
  const deleteYear = useDeleteYear();
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<any>(null);
  const [yearFormData, setYearFormData] = useState({ year: new Date().getFullYear(), is_active: true });

  // Duplicate checkers
  const checkFuelDuplicate = (name: string, currentId?: string) => {
    const trimmed = name.trim().toLowerCase();
    return fuelTypes.some(f => f.name.toLowerCase() === trimmed && f.id !== currentId);
  };

  const checkBodyDuplicate = (name: string, currentId?: string) => {
    const trimmed = name.trim().toLowerCase();
    return bodyTypes.some(b => b.name.toLowerCase() === trimmed && b.id !== currentId);
  };

  const checkTransDuplicate = (name: string, currentId?: string) => {
    const trimmed = name.trim().toLowerCase();
    return transmissions.some(t => t.name.toLowerCase() === trimmed && t.id !== currentId);
  };

  const checkSeatDuplicate = (seats: number, currentId?: string) => {
    return seatOptions.some(s => s.seats === seats && s.id !== currentId);
  };

  const checkYearDuplicate = (year: number, currentId?: string) => {
    return years.some(y => y.year === year && y.id !== currentId);
  };

  const createColumns = (type: 'fuel' | 'body' | 'trans' | 'seat' | 'year'): ColumnDef<any>[] => {
    const baseColumns: ColumnDef<any>[] = [
      { 
        accessorKey: type === 'seat' ? 'seats' : type === 'year' ? 'year' : 'name', 
        header: type === 'seat' ? 'Seats' : type === 'year' ? 'Year' : 'Name',
        cell: ({ row }) => type === 'seat' ? `${row.original.seats} Seater` : row.original[type === 'year' ? 'year' : 'name']
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
            {row.original.is_active ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
    ];

    if (type === 'body') {
      baseColumns.splice(1, 0, {
        accessorKey: 'icon',
        header: 'Icon',
        cell: ({ row }) => row.original.icon ? <span className="font-mono text-sm">{row.original.icon}</span> : '-'
      });
    }

    baseColumns.push({
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(type, row.original)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(type, row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    });

    return baseColumns;
  };

  const handleEdit = (type: string, item: any) => {
    setValidationError('');
    if (type === 'fuel') {
      setEditingFuel(item);
      setFuelFormData({ name: item.name, is_active: item.is_active });
      setIsFuelModalOpen(true);
    } else if (type === 'body') {
      setEditingBody(item);
      setBodyFormData({ name: item.name, icon: item.icon || '', is_active: item.is_active });
      setIsBodyModalOpen(true);
    } else if (type === 'trans') {
      setEditingTrans(item);
      setTransFormData({ name: item.name, is_active: item.is_active });
      setIsTransModalOpen(true);
    } else if (type === 'seat') {
      setEditingSeat(item);
      setSeatFormData({ seats: item.seats, is_active: item.is_active });
      setIsSeatModalOpen(true);
    } else if (type === 'year') {
      setEditingYear(item);
      setYearFormData({ year: item.year, is_active: item.is_active });
      setIsYearModalOpen(true);
    }
  };

  const handleDelete = (type: string, id: string) => {
    if (type === 'fuel') deleteFuelType.mutate(id);
    else if (type === 'body') deleteBodyType.mutate(id);
    else if (type === 'trans') deleteTransmission.mutate(id);
    else if (type === 'seat') deleteSeatOption.mutate(id);
    else if (type === 'year') deleteYear.mutate(id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Type Management</CardTitle>
        <CardDescription>Manage fuel types, body types, transmissions, seat options, and years</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="fuel">Fuel Types</TabsTrigger>
            <TabsTrigger value="body">Body Types</TabsTrigger>
            <TabsTrigger value="trans">Transmissions</TabsTrigger>
            <TabsTrigger value="seats">Seats</TabsTrigger>
            <TabsTrigger value="years">Years</TabsTrigger>
          </TabsList>

          <TabsContent value="fuel" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsFuelModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Fuel Type
              </Button>
            </div>
            {fuelLoading ? <Skeleton className="h-64" /> : <DataTable columns={createColumns('fuel')} data={fuelTypes} searchKey="name" />}
          </TabsContent>

          <TabsContent value="body" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsBodyModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Body Type
              </Button>
            </div>
            {bodyLoading ? <Skeleton className="h-64" /> : <DataTable columns={createColumns('body')} data={bodyTypes} searchKey="name" />}
          </TabsContent>

          <TabsContent value="trans" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsTransModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Transmission
              </Button>
            </div>
            {transLoading ? <Skeleton className="h-64" /> : <DataTable columns={createColumns('trans')} data={transmissions} searchKey="name" />}
          </TabsContent>

          <TabsContent value="seats" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsSeatModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Seat Option
              </Button>
            </div>
            {seatsLoading ? <Skeleton className="h-64" /> : <DataTable columns={createColumns('seat')} data={seatOptions} />}
          </TabsContent>

          <TabsContent value="years" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsYearModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Year
              </Button>
            </div>
            {yearsLoading ? <Skeleton className="h-64" /> : <DataTable columns={createColumns('year')} data={years} />}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Modals */}
      <FormModal open={isFuelModalOpen} onOpenChange={(open) => {
        setIsFuelModalOpen(open);
        if (!open) { setEditingFuel(null); setFuelFormData({ name: '', is_active: true }); setValidationError(''); }
      }} title={editingFuel ? `Edit Fuel Type: ${editingFuel.name}` : 'Add Fuel Type'}
        onSubmit={() => {
          const trimmedName = fuelFormData.name.trim();
          if (!trimmedName) { setValidationError('Name is required'); return; }
          if (checkFuelDuplicate(trimmedName, editingFuel?.id)) {
            setValidationError(`Fuel type "${trimmedName}" already exists`);
            return;
          }
          const submitData = { ...fuelFormData, name: trimmedName };
          if (editingFuel) {
            const changes: any = {};
            if (submitData.name !== editingFuel.name) changes.name = submitData.name;
            if (submitData.is_active !== editingFuel.is_active) changes.is_active = submitData.is_active;
            if (Object.keys(changes).length === 0) { setValidationError('No changes detected'); return; }
            updateFuelType.mutate({ id: editingFuel.id, ...changes });
          } else {
            createFuelType.mutate(submitData);
          }
          setIsFuelModalOpen(false);
          setEditingFuel(null);
          setFuelFormData({ name: '', is_active: true });
          setValidationError('');
        }}>
        <div className="space-y-4">
          {validationError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              {validationError}
            </div>
          )}
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={fuelFormData.name} onChange={(e) => { setFuelFormData({ ...fuelFormData, name: e.target.value }); setValidationError(''); }} placeholder="e.g., Petrol, Diesel" />
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={fuelFormData.is_active} onCheckedChange={(checked) => setFuelFormData({ ...fuelFormData, is_active: checked })} />
            <Label>Active</Label>
          </div>
        </div>
      </FormModal>

      <FormModal open={isBodyModalOpen} onOpenChange={setIsBodyModalOpen} title={editingBody ? 'Edit Body Type' : 'Add Body Type'}
        onSubmit={() => {
          editingBody ? updateBodyType.mutate({ id: editingBody.id, ...bodyFormData }) : createBodyType.mutate(bodyFormData);
          setIsBodyModalOpen(false);
          setEditingBody(null);
          setBodyFormData({ name: '', icon: '', is_active: true });
        }}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={bodyFormData.name} onChange={(e) => setBodyFormData({ ...bodyFormData, name: e.target.value })} placeholder="e.g., SUV, Sedan" />
          </div>
          <div className="space-y-2">
            <Label>Icon (Optional)</Label>
            <Input value={bodyFormData.icon} onChange={(e) => setBodyFormData({ ...bodyFormData, icon: e.target.value })} placeholder="e.g., Car, Truck" />
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={bodyFormData.is_active} onCheckedChange={(checked) => setBodyFormData({ ...bodyFormData, is_active: checked })} />
            <Label>Active</Label>
          </div>
        </div>
      </FormModal>

      <FormModal open={isTransModalOpen} onOpenChange={setIsTransModalOpen} title={editingTrans ? 'Edit Transmission' : 'Add Transmission'}
        onSubmit={() => {
          editingTrans ? updateTransmission.mutate({ id: editingTrans.id, ...transFormData }) : createTransmission.mutate(transFormData);
          setIsTransModalOpen(false);
          setEditingTrans(null);
          setTransFormData({ name: '', is_active: true });
        }}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={transFormData.name} onChange={(e) => setTransFormData({ ...transFormData, name: e.target.value })} placeholder="e.g., Manual, Automatic" />
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={transFormData.is_active} onCheckedChange={(checked) => setTransFormData({ ...transFormData, is_active: checked })} />
            <Label>Active</Label>
          </div>
        </div>
      </FormModal>

      <FormModal open={isSeatModalOpen} onOpenChange={setIsSeatModalOpen} title={editingSeat ? 'Edit Seat Option' : 'Add Seat Option'}
        onSubmit={() => {
          editingSeat ? updateSeatOption.mutate({ id: editingSeat.id, ...seatFormData }) : createSeatOption.mutate(seatFormData);
          setIsSeatModalOpen(false);
          setEditingSeat(null);
          setSeatFormData({ seats: 5, is_active: true });
        }}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Seats</Label>
            <Input type="number" value={seatFormData.seats} onChange={(e) => setSeatFormData({ ...seatFormData, seats: parseInt(e.target.value) })} placeholder="5" />
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={seatFormData.is_active} onCheckedChange={(checked) => setSeatFormData({ ...seatFormData, is_active: checked })} />
            <Label>Active</Label>
          </div>
        </div>
      </FormModal>

      <FormModal open={isYearModalOpen} onOpenChange={(open) => {
        setIsYearModalOpen(open);
        if (!open) { setEditingYear(null); setYearFormData({ year: new Date().getFullYear(), is_active: true }); setValidationError(''); }
      }} title={editingYear ? `Edit Year: ${editingYear.year}` : 'Add Year'}
        onSubmit={() => {
          const year = yearFormData.year;
          if (!year || year < 1900 || year > 2100) { setValidationError('Please enter a valid year (1900-2100)'); return; }
          if (checkYearDuplicate(year, editingYear?.id)) {
            setValidationError(`Year ${year} already exists`);
            return;
          }
          if (editingYear) {
            const changes: any = {};
            if (year !== editingYear.year) changes.year = year;
            if (yearFormData.is_active !== editingYear.is_active) changes.is_active = yearFormData.is_active;
            if (Object.keys(changes).length === 0) { setValidationError('No changes detected'); return; }
            updateYear.mutate({ id: editingYear.id, ...changes });
          } else {
            createYear.mutate(yearFormData);
          }
          setIsYearModalOpen(false);
          setEditingYear(null);
          setYearFormData({ year: new Date().getFullYear(), is_active: true });
          setValidationError('');
        }}>
        <div className="space-y-4">
          {validationError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              {validationError}
            </div>
          )}
          <div className="space-y-2">
            <Label>Year *</Label>
            <Input type="number" value={yearFormData.year} onChange={(e) => { setYearFormData({ ...yearFormData, year: parseInt(e.target.value) || new Date().getFullYear() }); setValidationError(''); }} placeholder="2024" min="1900" max="2100" />
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={yearFormData.is_active} onCheckedChange={(checked) => setYearFormData({ ...yearFormData, is_active: checked })} />
            <Label>Active</Label>
          </div>
        </div>
      </FormModal>
    </Card>
  );
}
