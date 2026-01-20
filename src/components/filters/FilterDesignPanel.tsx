import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState, useCallback } from 'react';
import { FilterRegistry } from '../../filters';
import type { FilterDesignBase } from '../../filters/base';
import type { FrequencyUnit } from '../Settings';
import { CollapsiblePanel } from '../CollapsiblePanel';

interface FilterDesignPanelProps {
  onFilterChange: (filterId: string, params: Record<string, any>) => void;
  logarithmicFrequency: boolean;
  frequencyUnit: FrequencyUnit;
}

export const FilterDesignPanel = ({ 
  onFilterChange, 
  logarithmicFrequency,
  frequencyUnit
}: FilterDesignPanelProps) => {
  const { t } = useTranslation();
  const [selectedFilterId, setSelectedFilterId] = useState<string>('none');
  const [selectedFilter, setSelectedFilter] = useState<FilterDesignBase | null>(null);

  const handleFilterSelect = (filterId: string) => {
    setSelectedFilterId(filterId);
    
    if (filterId === 'none') {
      setSelectedFilter(null);
      return;
    }

    const filter = FilterRegistry.get(filterId);
    if (filter) {
      setSelectedFilter(filter);
    }
  };

  const handleParamsChange = useCallback((params: Record<string, any>) => {
    if (selectedFilterId !== 'none' && selectedFilter) {
      onFilterChange(selectedFilterId, params);
    }
  }, [selectedFilterId, selectedFilter, onFilterChange]);

  const availableFilters = FilterRegistry.getAll();

  return (
    <CollapsiblePanel title={t('filterDesign.title')}>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>{t('filterDesign.filterType')}</InputLabel>
        <Select
          value={selectedFilterId}
          label={t('filterDesign.filterType')}
          onChange={(e) => handleFilterSelect(e.target.value)}
        >
          <MenuItem value="none">-</MenuItem>
          {availableFilters.map((filter) => (
            <MenuItem key={filter.id} value={filter.id}>
              {t(filter.nameKey)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedFilter && (
        <Box>
          <selectedFilter.PanelComponent
            onChange={handleParamsChange}
            logarithmicFrequency={logarithmicFrequency}
            frequencyUnit={frequencyUnit}
          />
        </Box>
      )}
    </CollapsiblePanel>
  );
};

