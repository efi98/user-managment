import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {GENDER_LABELS} from '@consts';

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
    @Input() stats: any = null;

    protected readonly genderBlankLabel = $localize`:@@dashboardGenderBlank:Blank`;
    private readonly ageStatisticLabels: Record<string, string> = {
        avg: $localize`:@@dashboardAgeAverage:Average`,
        min: $localize`:@@dashboardAgeMinimum:Minimum`,
        max: $localize`:@@dashboardAgeMaximum:Maximum`,
        median: $localize`:@@dashboardAgeMedian:Median`,
    };

    statKeys(obj: any, orderBy = 0): string[] {
        if (!obj) return [];
        const keys = Object.keys(obj);
        if (orderBy === 1) {
            return keys.sort((a, b) => obj[b] - obj[a]);
        }
        return keys;
    }

    ageStatisticLabel(key: string): string {
        return this.ageStatisticLabels[key] ?? key;
    }

    genderLabel(key: string): string {
        return key === 'blank'
            ? this.genderBlankLabel
            : GENDER_LABELS[key as keyof typeof GENDER_LABELS] ?? key;
    }
}
