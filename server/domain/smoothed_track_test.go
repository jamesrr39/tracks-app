package domain

import (
	"reflect"
	"testing"
	"time"

	"github.com/jamesrr39/go-errorsx"
)

func TestRecordsToSmoothedRecords(t *testing.T) {
	type args struct {
		records      []Record
		timeInterval time.Duration
	}
	tests := []struct {
		name  string
		args  args
		want  []SmoothedTrackRecord
		want1 errorsx.Error
	}{
		{
			name: "",
			args: args{
				records: []Record{
					{PositionLat: 0, PositionLong: 0, Timestamp: time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC)},
					{PositionLat: 0.1, PositionLong: 0.2, Timestamp: time.Date(2000, 1, 1, 0, 0, 10, 0, time.UTC)},
					{PositionLat: 0.3, PositionLong: 0.3, Timestamp: time.Date(2000, 1, 1, 0, 0, 15, 0, time.UTC)},
					{PositionLat: 0.6, PositionLong: 1, Timestamp: time.Date(2000, 1, 1, 0, 0, 25, 0, time.UTC)},
				},
				timeInterval: time.Second * 10,
			},
			want: []SmoothedTrackRecord{
				{PositionLat: 0, PositionLong: 0, Timestamp: time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC)},
				{PositionLat: 0.1, PositionLong: 0.2, Timestamp: time.Date(2000, 1, 1, 0, 0, 10, 0, time.UTC)},
				{PositionLat: 0.44999999999999996, PositionLong: 0.6499999999999999, Timestamp: time.Date(2000, 1, 1, 0, 0, 20, 0, time.UTC)},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, got1 := RecordsToSmoothedRecords(tt.args.records, tt.args.timeInterval)
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("RecordsToSmoothedRecords() got = %v, want %v", got, tt.want)
			}
			if !reflect.DeepEqual(got1, tt.want1) {
				t.Errorf("RecordsToSmoothedRecords() got1 = %v, want %v", got1, tt.want1)
			}
		})
	}
}
