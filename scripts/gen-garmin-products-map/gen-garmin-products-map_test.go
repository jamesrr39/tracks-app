package main

import "testing"

func Test_fixName(t *testing.T) {
	type args struct {
		inName string
	}
	tests := []struct {
		name string
		args args
		want string
	}{
		{
			args: args{
				inName: "TacxTrainingAppAndroid",
			},
			want: "Tacx Training App Android",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := fixName(tt.args.inName); got != tt.want {
				t.Errorf("fixName() = %v, want %v", got, tt.want)
			}
		})
	}
}
